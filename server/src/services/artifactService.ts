import ConfigManager from '../features/config/controllers/configManager';
import DeploymentManager from '../features/deployments/controllers/deploymentManager';
import DeploymentManifestManager from '../features/deployments/controllers/deploymentManifestManager';
import FileSessionService from './fileSessionService';
import { PulumiDeploymentService } from './pulumi/pulumiDeploymentService';

export default class ArtifactService {
    private static instance: ArtifactService;

    public static getInstance(): ArtifactService {
        if (!ArtifactService.instance) ArtifactService.instance = new ArtifactService();
        return ArtifactService.instance;
    }

    public isEnabled(): boolean {
        return ConfigManager.getConfig().artifactStore?.enabled === true;
    }

    private nextVersion(current?: string): string {
        const match = current?.match(/^v(\d+)$/);
        return match ? `v${parseInt(match[1], 10) + 1}` : 'v1';
    }

    /**
     * Publish a deployment that has never been published.
     *
     * Enabling the artifact store does not retroactively publish anything, so
     * without this an existing deployment keeps mounting the shared volume --
     * which is ReadWriteOnce, and so pins every instance to a single node.
     */
    public async publishIfUnpublished(deploymentName: string): Promise<void> {
        if (!this.isEnabled()) return;

        const deployment = DeploymentManager.getDeploymentByName(deploymentName);
        if (!deployment || deployment.manifest.artifactVersion) return;

        try {
            await this.publish(deploymentName);
        } catch (error) {
            // Never block a deploy on this: the instance falls back to mounting
            // the volume, which is what it did before.
            console.error(`[Artifacts] Initial publish failed for ${deploymentName}:`, error);
        }
    }

    public async publish(deploymentName: string): Promise<string | undefined> {
        if (!this.isEnabled()) return undefined;

        const deployment = DeploymentManager.getDeploymentByName(deploymentName);
        if (!deployment) throw new Error(`Deployment ${deploymentName} not found`);

        const namespace = ConfigManager.getConfig().namespace;
        const pvcName = await FileSessionService.getInstance().findPVCByLabels(
            deploymentName,
            deployment.type.identifier,
            namespace
        );

        const version = this.nextVersion(deployment.manifest.artifactVersion);

        const result = await PulumiDeploymentService.getInstance()
            .publishArtifact(deploymentName, version, pvcName);

        if (!result.success) {
            throw new Error(`Failed to publish ${deploymentName} ${version}: ${result.error?.message}`);
        }

        await DeploymentManifestManager.setArtifactVersion(deployment, version);

        console.log(`[Artifacts] Published ${deploymentName} ${version}`);
        return version;
    }
}