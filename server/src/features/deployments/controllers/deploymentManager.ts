import DeploymentManifestManager from './deploymentManifestManager';
import Deployment from '../models/deployment';
import {DeploymentType} from "../../../../../shared/enum/enums/deployment-type";
import {Enum} from "../../../../../shared/enum/enum";
import RedisService from "../../../services/redisService";
import { PulumiDeploymentService } from "../../../services/pulumi/pulumiDeploymentService";
import ArtifactService from "../../../services/artifactService";

export default class DeploymentManager {
    public static readonly MIN_SFTP_PORT_RANGE = 31400;
    public static readonly MAX_SFTP_PORT_RANGE = 31599;

    private static deployments: Deployment[] = [];

    public static async init() {
        console.log("loading deployments");
        await this.loadDeployments();

        if (!this.getDeploymentByName("proxy")) {
            await DeploymentManager.createDeployment("proxy", Enum.DeploymentType.PROXY);
            console.log("Proxy deployment missing, created default deployment");
        }

        await this.migrateToArtifacts();
        await this.syncDeploymentsToRedis();
        console.log("deployments loaded");
    }

    /**
     * Publish deployments that predate the artifact store.
     *
     * Until a deployment has an artifact its instances mount the shared volume
     * directly. That volume is ReadWriteOnce on most clusters, so every replica
     * landing on a second node fails to attach it and never schedules.
     */
    private static async migrateToArtifacts(): Promise<void> {
        const artifacts = ArtifactService.getInstance();
        if (!artifacts.isEnabled()) return;

        for (const deployment of this.deployments) {
            if (!deployment.toJSON().enabled || deployment.manifest.artifactVersion) continue;

            await artifacts.publishIfUnpublished(deployment.name);

            const manifest = await DeploymentManifestManager.getManifest(deployment.manifest.path);
            if (!manifest.artifactVersion) continue;

            console.log(`[Artifacts] Re-applying ${deployment.name} on ${manifest.artifactVersion}`);
            await PulumiDeploymentService.getInstance().applySingleDeployment(manifest);
        }
    }

    private static async syncDeploymentsToRedis(): Promise<void> {
        console.log("syncing deployments to redis");
        for (const deployment of this.deployments) {
            await RedisService.getInstance().syncDeploymentToRedis(
                deployment.name,
                deployment.toJSON().enabled
            );
        }
        console.log("deployments synced to redis");
    }

    public static async loadDeployments() {
        const manifestFiles = await DeploymentManifestManager.getAllManifests();
        DeploymentManager.deployments = manifestFiles.map(manifest => new Deployment(manifest));
    }

    public static async createDeployment(
        name: string,
        type: DeploymentType
    ): Promise<Deployment> {
        const manifestPath = await DeploymentManifestManager.createDeploymentManifest(name, type);
        const manifest = await DeploymentManifestManager.getManifest(manifestPath);
        const deployment = new Deployment(manifest);

        console.log(`[DeploymentManager] Applying new deployment ${name} via Pulumi...`);
        const pulumiService = PulumiDeploymentService.getInstance();
        const result = await pulumiService.applySingleDeployment(manifest);

        if (!result.success) {
            console.error(`[DeploymentManager] Failed to apply deployment ${name}:`, result.error);
            throw new Error(`Failed to apply deployment ${name}: ${result.error?.message}`);
        }

        console.log(`[DeploymentManager] Deployment ${name} applied successfully`);

        DeploymentManager.deployments.push(deployment);

        return deployment;
    }

    public static async deleteDeployment(name: string) {
        const deployment = this.getDeploymentByName(name);

        try {
            await DeploymentManifestManager.deleteDeploymentManifest(deployment);
        } catch (error) {
            console.error(error);
            throw new Error('failed to delete deployment manifest');
        }

        console.log(`[DeploymentManager] Destroying deployment ${name} via Pulumi...`);
        const pulumiService = PulumiDeploymentService.getInstance();
        const result = await pulumiService.destroySingleDeployment(name, deployment.type);

        if (!result.success) {
            console.error(`[DeploymentManager] Failed to destroy deployment ${name}:`, result.error);
            throw new Error(`Failed to destroy deployment ${name}: ${result.error?.message}`);
        }

        console.log(`[DeploymentManager] Deployment ${name} destroyed successfully`);

        DeploymentManager.deployments = DeploymentManager.deployments.filter(testDeployment => testDeployment !== deployment);
    }

    public static getDeploymentByName(name: string) {
        return this.getDeployments().find(deployment => deployment.name === name);
    }

    public static getDeployments(): Deployment[] {
        DeploymentManager.deployments.forEach((deployment: Deployment) => {
            console.log(`Deployment Manager: ${deployment.name}`);
        })

        return DeploymentManager.deployments;
    }

    public static getAvailableSftpPort(): number {
        const usedPorts: number[] = [];

        this.deployments.forEach((deployment: Deployment) => {
            if (deployment.getSftpPort()) usedPorts.push(deployment.getSftpPort());
        })

        for (let port = this.MIN_SFTP_PORT_RANGE; port <= this.MAX_SFTP_PORT_RANGE; port++) {
            if (!usedPorts.includes(port)) return port;
        }

        throw new Error('No available SFTP ports');
    }
}