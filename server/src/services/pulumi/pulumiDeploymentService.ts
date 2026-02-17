import * as k8s from "@pulumi/kubernetes";
import * as path from "path";
import { existsSync } from "fs";
import ConfigManager from "../../features/config/controllers/configManager";
import DeploymentManifestManager from "../../features/deployments/controllers/deploymentManifestManager";
import { Manifest } from "../../features/deployments/models/types";
import { DeploymentType } from "../../../../shared/enum/enums/deployment-type";
import { Enum } from "../../../../shared/enum/enum";
import { StateManager } from "./stateManager";
import { DeploymentResult } from "./types";
import AppConfig from "../../features/config/models/appConfig";

export class PulumiDeploymentService {
    private static instance: PulumiDeploymentService | null = null;
    private stateManager: StateManager;
    private globalValues: AppConfig | null = null;
    private readonly storagePath: string;
    private readonly chartBasePath: string;

    private constructor() {
        this.stateManager = StateManager.getInstance();
        this.storagePath = ConfigManager.getConfig().panel.storagePath;
        this.chartBasePath = path.join(this.storagePath, "chart-templates");
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

    private async applyDeploymentType(
        deploymentType: DeploymentType,
        manifests: Manifest[]
    ): Promise<DeploymentResult> {
        try {
            const program = this.createHelmChartProgram(deploymentType, manifests);

            const stackName = `${deploymentType.identifier}-deployments`;
            const stack = await this.stateManager.createOrSelectStack(stackName, program);

            console.log(`[Pulumi] Previewing changes for ${deploymentType.identifier}...`);
            const preview = await stack.preview({ onOutput: console.log });
            console.log(`[Pulumi] Preview: ${preview.changeSummary.create || 0} to create, ${preview.changeSummary.update || 0} to update, ${preview.changeSummary.delete || 0} to delete`);

            console.log(`[Pulumi] Applying ${deploymentType.identifier} deployments...`);
            const upResult = await stack.up({ onOutput: console.log });

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

    private createHelmChartProgram(
        deploymentType: DeploymentType,
        manifests: Manifest[]
    ): () => Promise<void> {
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
                            namespace: "default",
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
            const preview = await stack.preview({ onOutput: console.log });
            console.log(`[Pulumi] Preview: ${preview.changeSummary.create || 0} to create, ${preview.changeSummary.update || 0} to update, ${preview.changeSummary.delete || 0} to delete`);

            console.log(`[Pulumi] Applying deployment ${manifest.name}...`);
            const upResult = await stack.up({ onOutput: console.log });

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
            const upResult = await stack.up({ onOutput: console.log });

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
        sftpPort: number
    ): Promise<DeploymentResult> {
        try {
            console.log(`[Pulumi] Creating file session: ${sessionId} for deployment ${deploymentName}`);

            this.loadGlobalValues();

            const program = this.createFileSessionProgram(
                sessionId,
                sessionPodName,
                deploymentName,
                pvcName,
                sftpPort
            );

            const stackName = `file-session-${sessionId}`;
            const stack = await this.stateManager.createOrSelectStack(stackName, program);

            console.log(`[Pulumi] Applying file session ${sessionId}...`);
            const upResult = await stack.up({ onOutput: console.log });

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
            const upResult = await stack.up({ onOutput: console.log });

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
        sftpPort: number
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

            const values = {
                fileSession: {
                    podName: sessionPodName,
                    deploymentName: deploymentName,
                    mountPath: "/minecraft",
                    pvcName: pvcName
                },
                sftp: {
                    podName: sftpPodName,
                    username: `${deploymentName}_user`,
                    password: this.globalValues?.sftp?.password,
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
                    namespace: "default",
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

    public static reset(): void {
        PulumiDeploymentService.instance = null;
    }
}
