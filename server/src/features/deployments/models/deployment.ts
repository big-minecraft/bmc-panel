import kubernetesService from "../../../services/kubernetesService";
import sftpService from "../../../services/sftpService";
import DeploymentManifestManager, { DeploymentType } from '../controllers/deploymentManifestManager';

export default class Deployment {
    public readonly name: string;
    public readonly path: string;
    public readonly type: DeploymentType;
    private enabled: boolean;
    private dataDirectory: string;

    constructor(
        name: string,
        path: string,
        type: DeploymentType,
        enabled: boolean,
        dataDirectory: string
    ) {
        this.name = name;
        this.path = path;
        this.type = type;
        this.enabled = enabled;
        this.dataDirectory = dataDirectory;
    }

    public async setEnabled(enabled: boolean): Promise<void> {
        try {
            const { yamlContent } = await DeploymentManifestManager.updateDeploymentState(this.name, enabled);

            if (enabled) {
                const minimumInstances = yamlContent.scaling.minInstances || 1;
                await kubernetesService.scaleDeployment(this.name, minimumInstances);
            } else {
                await kubernetesService.scaleDeployment(this.name, 0);
            }
            this.enabled = enabled;
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

    public async delete(): Promise<void> {
        try {
            await DeploymentManifestManager.deleteDeploymentManifest(this.name);
            try {
                await sftpService.deleteSFTPDirectory(`nfsshare${this.dataDirectory}`);
            } catch (sftpError) {
                console.error('failed to delete sftp directory:', sftpError)
            }
        } catch (error) {
            console.error(error)
            throw new Error('failed to delete deployment')
        }
    }

    public async getContent(): Promise<string> {
        return await DeploymentManifestManager.getDeploymentContent(this.name);
    }

    public async updateContent(content: string): Promise<void> {
        await DeploymentManifestManager.updateDeploymentContent(this.name, content);
    }

    public toJSON() {
        return {
            name: this.name,
            path: this.path,
            enabled: this.enabled,
            dataDirectory: this.dataDirectory,
            type: this.type
        };
    }
}