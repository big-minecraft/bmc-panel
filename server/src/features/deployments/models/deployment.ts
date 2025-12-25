import DeploymentManifestManager from '../controllers/deploymentManifestManager';
import {Manifest} from "./types";
import DeploymentManager from "../controllers/deploymentManager";
import {DeploymentType} from "../../../../../shared/enum/enums/deployment-type";
import {Enum} from "../../../../../shared/enum/enum";
import {Instance} from "../../../../../shared/model/instance";
import RedisService from "../../../services/redisService";
import KubernetesService from "../../../services/kubernetesService";
import { PulumiDeploymentService } from "../../../services/pulumi/pulumiDeploymentService";

export default class Deployment {
    public readonly name: string;
    public readonly manifest: Manifest;
    public readonly type: DeploymentType;
    private isEnabled: boolean;
    private sftpPort: number;

    constructor(manifest: Manifest) {
        this.name = manifest.name;
        this.manifest = manifest;
        this.type = manifest.type;
        this.isEnabled = manifest.isEnabled;
        this.sftpPort = manifest.sftpPort;
    }

    public async setEnabled(enabled: boolean): Promise<void> {
        try {
            await DeploymentManifestManager.updateDeploymentState(this, enabled);

            if (enabled) {
                const minimumInstances = this.manifest?.content?.scaling?.minInstances || 1;
                await KubernetesService.getInstance().scaleWorkload(this.type.k8sResourceName, this.name, minimumInstances);
            } else {
                await KubernetesService.getInstance().scaleWorkload(this.type.k8sResourceName, this.name, 0);
            }
            this.isEnabled = enabled;
        } catch (error) {
            console.error('error in setEnabled:', error)
            throw new Error('failed to set deployment state')
        }
    }

    public async restart(): Promise<void> {
        const retryOperation = async (operation: () => Promise<void>) => {
            let retries = 3;
            while (retries > 0) {
                try {
                    await operation();
                    break;
                } catch (err) {
                    retries--;
                    if (retries === 0) throw err;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        };

        try {
            await retryOperation(() => this.setEnabled(false));
            await new Promise(resolve => setTimeout(resolve, 3000));
            await retryOperation(() => this.setEnabled(true));
        } catch (error) {
            console.error('error during restart:', error)
            throw error;
        }
    }

    public async getContent(): Promise<string> {
        return await DeploymentManifestManager.getDeploymentContent(this);
    }

    public getSftpPort(): number | undefined {
        return this.sftpPort;
    }

    public async updateContent(content: string): Promise<void> {
        await DeploymentManifestManager.updateDeploymentContent(this, content);

        const updatedManifest = await DeploymentManifestManager.getManifest(this.manifest.path);

        console.log(`[Deployment] Applying updated content for ${this.name} via Pulumi...`);
        const pulumiService = PulumiDeploymentService.getInstance();
        const result = await pulumiService.applySingleDeployment(updatedManifest);

        if (!result.success) {
            console.error(`[Deployment] Failed to apply updated content for ${this.name}:`, result.error);
            throw new Error(`Failed to apply updated content: ${result.error?.message}`);
        }

        console.log(`[Deployment] Updated content for ${this.name} applied successfully`);

        await DeploymentManager.sendRedisUpdates(this.name);
    }

    public async getInstances(): Promise<Instance[]> {
        return await RedisService.getInstance().getInstances(this);
    }

    public toJSON() {
        return {
            name: this.name,
            enabled: this.isEnabled,
            typeIndex: this.type.getIndex(),
            path: this.manifest.path,
        };
    }
}