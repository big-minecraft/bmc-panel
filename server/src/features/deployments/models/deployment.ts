import kubernetesService from "../../../services/kubernetesService";
import DeploymentManifestManager from '../controllers/deploymentManifestManager';
import {DeploymentType, Manifest} from "./types";
import DeploymentManager from "../controllers/deploymentManager";

export default class Deployment {
    public readonly name: string;
    public readonly manifest: Manifest;
    public readonly type: DeploymentType;
    private isEnabled: boolean;
    public dataDirectory: string;

    constructor(manifest: Manifest) {
        this.name = manifest.name;
        this.manifest = manifest;
        this.type = manifest.type;
        this.isEnabled = manifest.isEnabled;

        this.dataDirectory = `/deployments/${manifest.content.volume.dataDirectory}`;
        if (manifest.type === 'persistent') {
            const node = manifest.content.dedicatedNode;
            this.dataDirectory = `/nodes/${node}/deployments/${manifest.content.volume.dataDirectory}`;
        }
    }

    public async setEnabled(enabled: boolean): Promise<void> {
        try {
            await DeploymentManifestManager.updateDeploymentState(this, enabled);

            if (enabled) {
                const minimumInstances = this.manifest.content.scaling.minInstances || 1;
                await kubernetesService.scaleDeployment(this.name, minimumInstances);
            } else {
                await kubernetesService.scaleDeployment(this.name, 0);
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

    public async updateContent(content: string): Promise<void> {
        await DeploymentManifestManager.updateDeploymentContent(this, content);
        await DeploymentManager.runApplyScript();
        await DeploymentManager.sendProxyUpdate();
    }

    public toJSON() {
        return {
            name: this.name,
            path: this.manifest.path,
            enabled: this.isEnabled,
            dataDirectory: this.dataDirectory,
            type: this.type
        };
    }
}