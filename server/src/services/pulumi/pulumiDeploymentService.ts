import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as path from "path";
import { existsSync } from "fs";
import ConfigManager from "../../features/config/controllers/configManager";
import DeploymentManifestManager from "../../features/deployments/controllers/deploymentManifestManager";
import { Manifest } from "../../features/deployments/models/types";
import { DeploymentType } from "../../../../shared/enum/enums/deployment-type";
import { Enum } from "../../../../shared/enum/enum";
import { ConcurrentUpdateError, Stack, UpResult } from "@pulumi/pulumi/automation";
import { StateManager } from "./stateManager";
import { DeploymentResult, PublishResult } from "./types";
import AppConfig from "../../features/config/models/appConfig";
import * as k8sClient from "@kubernetes/client-node";
import KubernetesService from "../kubernetesService";

export class PulumiDeploymentService {
    private static readonly PUBLISH_SKIP_EXIT_CODE = 3;
    private static readonly PUBLISH_LOG_TAIL_LINES = 50;
    private static readonly JOB_DELETE_TIMEOUT_MS = 30000;
    private static readonly PUBLISH_JOB_TIMEOUT_MS = 600000;
    private static readonly PUBLISH_JOB_POLL_MS = 2000;
    private static readonly PUBLISH_JOB_APPEAR_MS = 60000;
    private static readonly STACK_UP_TIMEOUT_MS = 600000;
    private static readonly STACK_UP_ATTEMPTS = 5;
    private static readonly STACK_UP_RETRY_BASE_MS = 2000;

    private static instance: PulumiDeploymentService | null = null;
    private stateManager: StateManager;
    private globalValues: AppConfig | null = null;
    private readonly storagePath: string;
    private readonly chartBasePath: string;

    private constructor() {
        this.stateManager = StateManager.getInstance();
        this.storagePath = ConfigManager.getConfig().panel.storagePath;
        this.chartBasePath = process.env.BMC_RUNTIME_CHARTS_PATH
            || path.join(this.storagePath, "chart-templates");
    }

    public static getInstance(): PulumiDeploymentService {
        if (!PulumiDeploymentService.instance) PulumiDeploymentService.instance = new PulumiDeploymentService();
        return PulumiDeploymentService.instance;
    }

    public async applyDeployments(): Promise<DeploymentResult> {
        try {
            console.log("[Pulumi] Starting deployment process...");

            this.loadGlobalValues();

            const manifests = await DeploymentManifestManager.getAllManifests();
            console.log(`[Pulumi] Found ${manifests.length} total manifests`);

            const manifestsByType = this.groupManifestsByType(manifests);

            const results = {
                created: 0,
                updated: 0,
                deleted: 0,
                unchanged: 0
            };

            for (const deploymentType of Enum.DeploymentType.values()) {
                const typeManifests = manifestsByType[deploymentType.identifier] || [];
                const enabledManifests = typeManifests.filter(m => m.isEnabled);

                console.log(`[Pulumi] Processing ${deploymentType.identifier}: ${enabledManifests.length} enabled`);

                const result = await this.applyDeploymentType(deploymentType, enabledManifests);
                results.created += result.summary?.created || 0;
                results.updated += result.summary?.updated || 0;
                results.deleted += result.summary?.deleted || 0;
                results.unchanged += result.summary?.unchanged || 0;
            }

            console.log("[Pulumi] Deployment process completed successfully");
            console.log(`[Pulumi] Summary: ${results.created} created, ${results.updated} updated, ${results.deleted} deleted, ${results.unchanged} unchanged`);

            return {
                success: true,
                summary: results
            };
        } catch (error) {
            console.error("[Pulumi] Deployment process failed:", error);
            return {
                success: false,
                error: error as Error
            };
        }
    }

    private async applyDeploymentType(deploymentType: DeploymentType, manifests: Manifest[]): Promise<DeploymentResult> {
        try {
            const program = this.createHelmChartProgram(deploymentType, manifests);

            const stackName = `${deploymentType.identifier}-deployments`;
            const stack = await this.stateManager.createOrSelectStack(stackName, program);

            console.log(`[Pulumi] Previewing changes for ${deploymentType.identifier}...`);
            const preview = await stack.preview({ onOutput: console.log, refresh: true });
            console.log(`[Pulumi] Preview: ${preview.changeSummary.create || 0} to create, ${preview.changeSummary.update || 0} to update, ${preview.changeSummary.delete || 0} to delete`);

            console.log(`[Pulumi] Applying ${deploymentType.identifier} deployments...`);
            const upResult = await this.runStackUp(stack, `${deploymentType.identifier} deployments`);

            if (upResult.summary.result === "failed") {
                throw new Error(`Pulumi up failed for ${deploymentType.identifier}: ${upResult.summary.message}`);
            }

            return {
                success: true,
                summary: {
                    created: upResult.summary.resourceChanges?.create || 0,
                    updated: upResult.summary.resourceChanges?.update || 0,
                    deleted: upResult.summary.resourceChanges?.delete || 0,
                    unchanged: upResult.summary.resourceChanges?.same || 0
                }
            };
        } catch (error) {
            console.error(`[Pulumi] Failed to apply ${deploymentType.identifier} deployments:`, error);
            throw error;
        }
    }

    private createHelmChartProgram(deploymentType: DeploymentType, manifests: Manifest[]): () => Promise<void> {
        return async () => {
            const k8sProvider = new k8s.Provider("k8s-provider", {
                enableServerSideApply: true
            });

            const chartPath = this.getChartPath(deploymentType);

            if (!existsSync(chartPath)) {
                console.warn(`[Pulumi] Chart not found at ${chartPath}, skipping`);
                return;
            }

            for (const manifest of manifests) {
                const releaseName = manifest.name;
                const values = this.buildHelmValues(manifest);

                console.log(`[Pulumi] Deploying Helm chart for ${releaseName} (${deploymentType.identifier})`);

                try {
                    new k8s.helm.v3.Chart(
                        releaseName,
                        {
                            path: chartPath,
                            namespace: ConfigManager.getConfig().namespace,
                            values: values,
                            skipAwait: true,
                            transformations: [
                                (obj: any) => {
                                    if (obj.metadata && obj.metadata.annotations) {
                                        obj.metadata.annotations["pulumi.com/patchForce"] = "true";
                                    } else if (obj.metadata) {
                                        obj.metadata.annotations = { "pulumi.com/patchForce": "true" };
                                    }
                                }
                            ]
                        },
                        { provider: k8sProvider }
                    );
                } catch (error) {
                    console.error(`[Pulumi] Failed to deploy Helm chart for ${releaseName}:`, error);
                    throw error;
                }
            }
        };
    }

    private getChartPath(deploymentType: DeploymentType): string {
        const chartMapping: Record<string, string> = {
            "persistent": "persistent-deployment-chart",
            "scalable": "scalable-deployment-chart",
            "proxy": "proxy-chart",
            "process": "process-chart"
        };

        const chartName = chartMapping[deploymentType.identifier];
        return path.join(this.chartBasePath, chartName);
    }

    private buildHelmValues(manifest: Manifest): Record<string, any> {
        const deploymentValues = manifest.content;

        const values: Record<string, any> = {
            name: manifest.name,

            global: this.globalValues,

            ...deploymentValues
        };

        values.deployment = {
            type: manifest.type.identifier
        };

        // Instances pull this version instead of mounting the shared volume.
        // Absent until something has been published, which is what keeps the
        // old path working for deployments that have not been published yet.
        if (manifest.artifactVersion) {
            values.artifactVersion = manifest.artifactVersion;
        }

        return values;
    }

    private loadGlobalValues(): void {
        this.globalValues = ConfigManager.getConfig();
    }

    private groupManifestsByType(manifests: Manifest[]): Record<string, Manifest[]> {
        const grouped: Record<string, Manifest[]> = {};

        for (const manifest of manifests) {
            const typeId = manifest.type.identifier;
            if (!grouped[typeId]) {
                grouped[typeId] = [];
            }
            grouped[typeId].push(manifest);
        }

        return grouped;
    }

    public async applySingleDeployment(manifest: Manifest): Promise<DeploymentResult> {
        try {
            console.log(`[Pulumi] Applying single deployment: ${manifest.name} (${manifest.type.identifier})`);

            this.loadGlobalValues();

            const program = this.createHelmChartProgram(manifest.type, [manifest]);
            const stackName = `${manifest.type.identifier}-${manifest.name}`;
            const stack = await this.stateManager.createOrSelectStack(stackName, program);

            console.log(`[Pulumi] Previewing changes for ${manifest.name}...`);
            const preview = await stack.preview({ onOutput: console.log, refresh: true });
            console.log(`[Pulumi] Preview: ${preview.changeSummary.create || 0} to create, ${preview.changeSummary.update || 0} to update, ${preview.changeSummary.delete || 0} to delete`);

            console.log(`[Pulumi] Applying deployment ${manifest.name}...`);
            const upResult = await this.runStackUp(stack, `deployment ${manifest.name}`);

            if (upResult.summary.result === "failed") {
                throw new Error(`Pulumi up failed for ${manifest.name}: ${upResult.summary.message}`);
            }

            const result = {
                success: true,
                summary: {
                    created: upResult.summary.resourceChanges?.create || 0,
                    updated: upResult.summary.resourceChanges?.update || 0,
                    deleted: upResult.summary.resourceChanges?.delete || 0,
                    unchanged: upResult.summary.resourceChanges?.same || 0
                }
            };

            console.log(`[Pulumi] Deployment ${manifest.name} applied successfully`);
            console.log(`[Pulumi] Summary: ${result.summary.created} created, ${result.summary.updated} updated, ${result.summary.deleted} deleted, ${result.summary.unchanged} unchanged`);

            return result;
        } catch (error) {
            console.error(`[Pulumi] Failed to apply deployment ${manifest.name}:`, error);
            return {
                success: false,
                error: error as Error
            };
        }
    }

    public async destroySingleDeployment(deploymentName: string, deploymentType: DeploymentType): Promise<DeploymentResult> {
        try {
            console.log(`[Pulumi] Destroying deployment: ${deploymentName} (${deploymentType.identifier})`);

            const stackName = `${deploymentType.identifier}-${deploymentName}`;

            // Create an empty program - when applied, this will remove all resources
            const emptyProgram = async () => {
                // Empty program - this will cause all resources to be destroyed when up() is called
            };

            const stack = await this.stateManager.createOrSelectStack(stackName, emptyProgram);

            console.log(`[Pulumi] Applying empty state to destroy resources in stack ${stackName}...`);
            const upResult = await this.runStackUp(stack, `destroy of ${deploymentName}`);

            if (upResult.summary.result === "failed") {
                throw new Error(`Pulumi destroy failed for ${deploymentName}: ${upResult.summary.message}`);
            }

            const result = {
                success: true,
                summary: {
                    created: 0,
                    updated: 0,
                    deleted: upResult.summary.resourceChanges?.delete || 0,
                    unchanged: 0
                }
            };

            console.log(`[Pulumi] Deployment ${deploymentName} destroyed successfully (${result.summary.deleted} resources deleted)`);

            return result;
        } catch (error) {
            console.error(`[Pulumi] Failed to destroy deployment ${deploymentName}:`, error);
            return {
                success: false,
                error: error as Error
            };
        }
    }

    public async createFileSession(
        sessionId: string,
        sessionPodName: string,
        deploymentName: string,
        pvcName: string,
        sftpPort: number,
        publicKeys: string[] = []
    ): Promise<DeploymentResult> {
        try {
            console.log(`[Pulumi] Creating file session: ${sessionId} for deployment ${deploymentName}`);

            this.loadGlobalValues();

            const program = this.createFileSessionProgram(
                sessionId,
                sessionPodName,
                deploymentName,
                pvcName,
                sftpPort,
                publicKeys
            );

            const stackName = `file-session-${sessionId}`;
            const stack = await this.stateManager.createOrSelectStack(stackName, program);

            console.log(`[Pulumi] Applying file session ${sessionId}...`);
            const upResult = await this.runStackUp(stack, `file session ${sessionId}`);

            if (upResult.summary.result === "failed") {
                throw new Error(`Pulumi up failed for file session ${sessionId}: ${upResult.summary.message}`);
            }

            const result = {
                success: true,
                summary: {
                    created: upResult.summary.resourceChanges?.create || 0,
                    updated: upResult.summary.resourceChanges?.update || 0,
                    deleted: upResult.summary.resourceChanges?.delete || 0,
                    unchanged: upResult.summary.resourceChanges?.same || 0
                }
            };

            console.log(`[Pulumi] File session ${sessionId} created successfully`);
            return result;
        } catch (error) {
            console.error(`[Pulumi] Failed to create file session ${sessionId}:`, error);
            return {
                success: false,
                error: error as Error
            };
        }
    }

    public async publishArtifact(
        deploymentName: string,
        version: string,
        pvcName: string
    ): Promise<PublishResult> {
        const jobName = `publish-${deploymentName}-${version}`;

        try {
            console.log(`[Pulumi] Publishing ${deploymentName} ${version}`);

            this.loadGlobalValues();

            const nodeName = await this.findNodeHoldingVolume(pvcName);
            if (nodeName) {
                console.log(`[Pulumi] ${pvcName} is attached to ${nodeName}; pinning publish Job there`);
            }

            await this.deletePublishJob(jobName);

            const program = this.createPublishProgram(deploymentName, version, pvcName, jobName, nodeName);
            const stackName = `artifact-publish-${deploymentName}`;
            const stack = await this.stateManager.createOrSelectStack(stackName, program);

            const upResult = await this.runStackUp(stack, `publish ${deploymentName} ${version}`);

            if (upResult.summary.result === "failed") {
                throw new Error(`Publish failed for ${deploymentName}: ${upResult.summary.message}`);
            }

            const completion = await this.waitForPublishJob(jobName);

            if (completion.skipped) {
                console.log(`[Pulumi] ${deploymentName} had no deployment files to publish; skipping ${version}`);
                return { success: true, skipped: true };
            }

            if (!completion.succeeded) {
                const message = `Publish failed for ${deploymentName} ${version}`;
                console.error(`[Pulumi] ${message}`);
                if (completion.detail) console.error(completion.detail);

                return {
                    success: false,
                    error: new Error(completion.detail ? `${message}\n${completion.detail}` : message)
                };
            }

            console.log(`[Pulumi] Published ${deploymentName} ${version}`);
            return {
                success: true,
                summary: {
                    created: upResult.summary.resourceChanges?.create || 0,
                    updated: upResult.summary.resourceChanges?.update || 0,
                    deleted: upResult.summary.resourceChanges?.delete || 0,
                    unchanged: upResult.summary.resourceChanges?.same || 0
                }
            };
        } catch (error) {
            const outcome = await this.inspectPublishJob(jobName);

            if (outcome.skipped) {
                console.log(`[Pulumi] ${deploymentName} had no deployment files to publish; skipping ${version}`);
                return { success: true, skipped: true };
            }

            console.error(`[Pulumi] Failed to publish ${deploymentName} ${version}:`, error);
            if (outcome.detail) console.error(outcome.detail);

            const message = (error as Error).message;
            return {
                success: false,
                error: new Error(outcome.detail ? `${message}\n${outcome.detail}` : message)
            };
        }
    }

    private async waitForPublishJob(jobName: string): Promise<{ succeeded: boolean; skipped: boolean; detail?: string }> {
        const namespace = ConfigManager.getConfig().namespace;
        const batchApi = KubernetesService.getInstance().kc.makeApiClient(k8sClient.BatchV1Api);

        const start = Date.now();
        const deadline = start + PulumiDeploymentService.PUBLISH_JOB_TIMEOUT_MS;
        let seen = false;

        while (Date.now() < deadline) {
            let conditions: k8sClient.V1JobCondition[] | undefined;

            try {
                const job = await batchApi.readNamespacedJob(jobName, namespace);
                conditions = job.body.status?.conditions || [];
                seen = true;
            } catch (error: any) {
                if (error.statusCode !== 404) {
                    console.error(`[Pulumi] Could not read publish Job ${jobName}:`, error);
                } else if (seen) {
                    return { succeeded: false, skipped: false, detail: `${jobName} disappeared before it finished` };
                } else if (Date.now() - start > PulumiDeploymentService.PUBLISH_JOB_APPEAR_MS) {
                    return { succeeded: false, skipped: false, detail: `${jobName} was never created` };
                }
            }

            const failed = conditions?.find(c => c.type === "Failed" && c.status === "True");
            if (failed) {
                const outcome = await this.inspectPublishJob(jobName);
                return {
                    succeeded: false,
                    skipped: outcome.skipped,
                    detail: outcome.detail || `${failed.reason || ""} ${failed.message || ""}`.trim()
                };
            }

            if (conditions?.some(c => c.type === "Complete" && c.status === "True")) {
                return { succeeded: true, skipped: false };
            }

            await this.sleep(PulumiDeploymentService.PUBLISH_JOB_POLL_MS);
        }

        const outcome = await this.inspectPublishJob(jobName);
        const timedOut = `${jobName} did not finish within ${PulumiDeploymentService.PUBLISH_JOB_TIMEOUT_MS}ms`;
        return {
            succeeded: false,
            skipped: false,
            detail: outcome.detail ? `${timedOut}\n${outcome.detail}` : timedOut
        };
    }

    private async deletePublishJob(jobName: string): Promise<void> {
        const namespace = ConfigManager.getConfig().namespace;
        const batchApi = KubernetesService.getInstance().kc.makeApiClient(k8sClient.BatchV1Api);

        try {
            await batchApi.deleteNamespacedJob(
                jobName,
                namespace,
                undefined,
                undefined,
                undefined,
                undefined,
                "Foreground"
            );
            console.log(`[Pulumi] Cleared a previous publish Job ${jobName}`);
        } catch (error: any) {
            if (error.statusCode === 404) return;

            console.error(`[Pulumi] Could not delete publish Job ${jobName}:`, error);
            return;
        }

        const deadline = Date.now() + PulumiDeploymentService.JOB_DELETE_TIMEOUT_MS;
        while (Date.now() < deadline) {
            try {
                await batchApi.readNamespacedJob(jobName, namespace);
            } catch (error: any) {
                if (error.statusCode === 404) return;
                console.error(`[Pulumi] Could not confirm publish Job ${jobName} is gone:`, error);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.warn(`[Pulumi] Publish Job ${jobName} still exists after deletion; publishing anyway`);
    }

    private async inspectPublishJob(jobName: string): Promise<{ skipped: boolean; detail?: string }> {
        try {
            const namespace = ConfigManager.getConfig().namespace;
            const coreApi = KubernetesService.getInstance().kc.makeApiClient(k8sClient.CoreV1Api);

            const pods = await coreApi.listNamespacedPod(
                namespace,
                undefined,
                undefined,
                undefined,
                undefined,
                `job-name=${jobName}`
            );

            const exitCodes = pods.body.items
                .flatMap(pod => [
                    ...(pod.status?.initContainerStatuses || []),
                    ...(pod.status?.containerStatuses || [])
                ])
                .map(status => status.state?.terminated?.exitCode)
                .filter((code): code is number => code !== undefined && code !== 0);

            if (exitCodes.length) {
                if (exitCodes.every(code => code === PulumiDeploymentService.PUBLISH_SKIP_EXIT_CODE)) {
                    return { skipped: true };
                }

                const logs = await this.readPublishJobLogs(pods.body.items);
                const codes = `${jobName} exited ${exitCodes.join(", ")}`;
                return { skipped: false, detail: logs ? `${codes}\n${logs}` : codes };
            }

            const failure = await this.readPublishJobFailure(jobName);
            if (failure?.reason === "PodFailurePolicy") return { skipped: true };

            const logs = await this.readPublishJobLogs(pods.body.items);
            const detail = [
                failure && `${jobName} failed: ${failure.reason} ${failure.message}`.trim(),
                logs
            ].filter(Boolean).join("\n");

            return { skipped: false, detail: detail || undefined };
        } catch (error) {
            console.error(`[Pulumi] Could not inspect publish Job ${jobName}:`, error);
            return { skipped: false };
        }
    }

    private async readPublishJobLogs(pods: k8sClient.V1Pod[]): Promise<string> {
        const namespace = ConfigManager.getConfig().namespace;
        const coreApi = KubernetesService.getInstance().kc.makeApiClient(k8sClient.CoreV1Api);

        const sections: string[] = [];

        for (const pod of pods) {
            const podName = pod.metadata?.name;
            if (!podName) continue;

            const containers = [
                ...(pod.spec?.initContainers || []),
                ...(pod.spec?.containers || [])
            ].map(container => container.name);

            for (const container of containers.length ? containers : [undefined]) {
                try {
                    const logs = await coreApi.readNamespacedPodLog(
                        podName,
                        namespace,
                        container,
                        false,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        PulumiDeploymentService.PUBLISH_LOG_TAIL_LINES
                    );

                    const body = (logs.body || "").trim();
                    if (body) sections.push(`--- ${podName}${container ? `/${container}` : ""} ---\n${body}`);
                } catch (error) {
                    console.error(`[Pulumi] Could not read logs for ${podName}:`, error);
                }
            }
        }

        return sections.join("\n");
    }

    private async readPublishJobFailure(jobName: string): Promise<{ reason: string; message: string } | undefined> {
        const namespace = ConfigManager.getConfig().namespace;
        const batchApi = KubernetesService.getInstance().kc.makeApiClient(k8sClient.BatchV1Api);

        try {
            const job = await batchApi.readNamespacedJob(jobName, namespace);

            const condition = (job.body.status?.conditions || [])
                .find(c => c.type === "Failed" && c.status === "True");

            if (!condition) return undefined;
            return { reason: condition.reason || "", message: condition.message || "" };
        } catch (error: any) {
            if (error.statusCode !== 404) {
                console.error(`[Pulumi] Could not read publish Job ${jobName}:`, error);
            }
            return undefined;
        }
    }

    /**
     * The node a ReadWriteOnce claim is currently attached to, if any.
     *
     * Returns undefined when nothing holds it, which lets the scheduler place
     * the Job wherever it likes.
     */
    private async findNodeHoldingVolume(pvcName: string): Promise<string | undefined> {
        try {
            const kc = KubernetesService.getInstance().kc;
            const namespace = ConfigManager.getConfig().namespace;

            const pvc = await kc.makeApiClient(k8sClient.CoreV1Api)
                .readNamespacedPersistentVolumeClaim(pvcName, namespace);
            const volumeName = pvc.body.spec?.volumeName;
            if (!volumeName) return undefined;

            const attachments = await kc.makeApiClient(k8sClient.StorageV1Api)
                .listVolumeAttachment();

            return attachments.body.items.find(attachment =>
                attachment.spec.source.persistentVolumeName === volumeName
                && attachment.status?.attached
            )?.spec.nodeName;
        } catch (error) {
            // Not worth failing a publish over: without a pin the Job still
            // succeeds whenever the volume happens to be free.
            console.error(`[Pulumi] Could not resolve the node holding ${pvcName}:`, error);
            return undefined;
        }
    }

    private createPublishProgram(
        deploymentName: string,
        version: string,
        pvcName: string,
        jobName: string,
        nodeName?: string
    ): () => Promise<void> {
        return async () => {
            const k8sProvider = new k8s.Provider("k8s-provider", {
                enableServerSideApply: true
            });

            const chartPath = path.join(this.chartBasePath, "artifact-publish-chart");

            if (!existsSync(chartPath)) {
                throw new Error(`Artifact publish chart not found at ${chartPath}`);
            }

            const values = {
                global: this.globalValues,
                publish: {
                    jobName,
                    deploymentName,
                    version,
                    pvcName,
                    nodeName,
                    mountPath: "/minecraft"
                }
            };

            new k8s.helm.v3.Chart(
                `artifact-publish-${deploymentName}`,
                {
                    path: chartPath,
                    namespace: ConfigManager.getConfig().namespace,
                    values: values,
                    skipAwait: true,
                    transformations: [
                        (obj: any, opts: pulumi.CustomResourceOptions) => {
                            if (obj.kind !== "Job") return;
                            opts.replaceOnChanges = ["*"];
                            opts.deleteBeforeReplace = true;
                        }
                    ]
                },
                { provider: k8sProvider }
            );
        };
    }

    public async destroyFileSession(sessionId: string): Promise<DeploymentResult> {
        try {
            console.log(`[Pulumi] Destroying file session: ${sessionId}`);

            const stackName = `file-session-${sessionId}`;

            // Create an empty program - when applied, this will remove all resources
            const emptyProgram = async () => {
                // Empty program - this will cause all resources to be destroyed when up() is called
            };

            const stack = await this.stateManager.createOrSelectStack(stackName, emptyProgram);

            console.log(`[Pulumi] Applying empty state to destroy file session ${sessionId}...`);
            const upResult = await this.runStackUp(stack, `destroy of file session ${sessionId}`);

            if (upResult.summary.result === "failed") {
                throw new Error(`Pulumi destroy failed for file session ${sessionId}: ${upResult.summary.message}`);
            }

            const result = {
                success: true,
                summary: {
                    created: 0,
                    updated: 0,
                    deleted: upResult.summary.resourceChanges?.delete || 0,
                    unchanged: 0
                }
            };

            console.log(`[Pulumi] File session ${sessionId} destroyed successfully (${result.summary.deleted} resources deleted)`);

            return result;
        } catch (error) {
            console.error(`[Pulumi] Failed to destroy file session ${sessionId}:`, error);
            return {
                success: false,
                error: error as Error
            };
        }
    }

    private createFileSessionProgram(
        sessionId: string,
        sessionPodName: string,
        deploymentName: string,
        pvcName: string,
        sftpPort: number,
        publicKeys: string[]
    ): () => Promise<void> {
        return async () => {
            const k8sProvider = new k8s.Provider("k8s-provider", {
                enableServerSideApply: true
            });

            const chartPath = path.join(this.chartBasePath, "file-session-chart");

            if (!existsSync(chartPath)) {
                throw new Error(`File session chart not found at ${chartPath}`);
            }

            const sftpPodName = `sftp-${deploymentName}-${sessionId.substring(0, 8)}`;

            const panelHost = ConfigManager.getConfig().panel.panelHost;
            const passwordAuth = this.globalValues?.sftp?.passwordAuth !== false;

            const values = {
                global: this.globalValues,

                fileSession: {
                    podName: sessionPodName,
                    deploymentName: deploymentName,
                    mountPath: "/minecraft",
                    pvcName: pvcName
                },
                sftp: {
                    podName: sftpPodName,
                    username: `${deploymentName}_user`,
                    password: passwordAuth ? this.globalValues?.sftp?.password : undefined,
                    publicKeys,
                    port: 22,
                    pvcName: pvcName,
                    nodePort: sftpPort
                },
                activityWatcher: {
                    sessionId: sessionId,
                    serviceToken: ConfigManager.getConfig().panel.panelSecret,
                    panelUrl: `https://${panelHost}`
                }
            };

            console.log(`[Pulumi] Deploying file session Helm chart for ${sessionPodName}`);

            new k8s.helm.v3.Chart(
                `file-session-${sessionId}`,
                {
                    path: chartPath,
                    namespace: ConfigManager.getConfig().namespace,
                    values: values,
                    skipAwait: true,
                    transformations: [
                        (obj: any) => {
                            if (obj.metadata && obj.metadata.annotations) {
                                obj.metadata.annotations["pulumi.com/patchForce"] = "true";
                            } else if (obj.metadata) {
                                obj.metadata.annotations = { "pulumi.com/patchForce": "true" };
                            }
                        }
                    ]
                },
                { provider: k8sProvider }
            );
        };
    }

    private async runStackUp(stack: Stack, label: string): Promise<UpResult> {
        for (let attempt = 1; ; attempt++) {
            try {
                return await this.withTimeout(
                    stack.up({ onOutput: console.log, refresh: true }),
                    PulumiDeploymentService.STACK_UP_TIMEOUT_MS,
                    `Pulumi up for ${label}`,
                    async () => {
                        try {
                            await stack.cancel();
                        } catch (error) {
                            console.error(`[Pulumi] Could not cancel the update for ${label}:`, error);
                        }
                    }
                );
            } catch (error) {
                if (!(error instanceof ConcurrentUpdateError)
                    || attempt >= PulumiDeploymentService.STACK_UP_ATTEMPTS) {
                    throw error;
                }

                const delay = PulumiDeploymentService.STACK_UP_RETRY_BASE_MS * 2 ** (attempt - 1);
                console.warn(`[Pulumi] ${label} is locked by another update; retrying in ${delay}ms`);
                await this.sleep(delay);
            }
        }
    }

    private async withTimeout<T>(
        work: Promise<T>,
        timeoutMs: number,
        label: string,
        onTimeout: () => Promise<void>
    ): Promise<T> {
        let timer: NodeJS.Timeout | undefined;

        const expiry = new Promise<never>((_resolve, reject) => {
            timer = setTimeout(async () => {
                await onTimeout();
                reject(new Error(`${label} timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });

        work.catch(() => undefined);

        try {
            return await Promise.race([work, expiry]);
        } finally {
            clearTimeout(timer);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static reset(): void {
        PulumiDeploymentService.instance = null;
    }
}
