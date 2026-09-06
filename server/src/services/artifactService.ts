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