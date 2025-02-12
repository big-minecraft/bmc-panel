import config from '../../../config';
import path from 'path';
import yaml from 'js-yaml';
import kubernetesService from "../../../services/kubernetesService";
import redisService from "../../../services/redisService";
import sftpService from "../../../services/sftpService";
import {Deployment} from "../models/deployment";
import Util from "../../../misc/util";
import DeploymentManifestManager, {DeploymentType} from './deploymentManifestManager';

export default class DeploymentManager {
    private static instance: DeploymentManager;

    private constructor() {}

    public async getDeployments(): Promise<Deployment[]> {
        await kubernetesService.listNodeNames();
        const manifestFiles = await DeploymentManifestManager.listManifestFiles();

        return manifestFiles.map(manifest => {
            let dataDir = `/deployments/${manifest.content.volume.dataDirectory || manifest.name}`;

            if (manifest.type === 'persistent') {
                const node = manifest.content.dedicatedNode;
                dataDir = `/nodes/${node}/deployments/${manifest.content.volume.dataDirectory || manifest.name}`;
            }

            return {
                name: manifest.name,
                path: manifest.path,
                enabled: manifest.isEnabled,
                dataDirectory: dataDir,
                type: manifest.type
            };
        });
    }

    public async getDeploymentContent(name: string): Promise<string> {
        return await DeploymentManifestManager.getDeploymentContent(name);
    }

    public async updateDeploymentContent(name: string, content: string): Promise<void> {
        await DeploymentManifestManager.updateDeploymentContent(name, content);
        await this.runApplyScript();
        await redisService.sendDeploymentUpdate();
    }

    public async setDeploymentState(name: string, enabled: boolean): Promise<void> {
        try {
            const { yamlContent } = await DeploymentManifestManager.updateDeploymentState(name, enabled);

            if (enabled) {
                const minimumInstances = yamlContent.scaling.minInstances || 1;
                await kubernetesService.scaleDeployment(name, minimumInstances);
            } else {
                await kubernetesService.scaleDeployment(name, 0);
            }
        } catch (error) {
            console.error('Error in toggleDeployment:', error);
            throw new Error('Failed to toggle deployment');
        }
    }

    public async createDeployment(
        name: string,
        type: DeploymentType,
        node?: string
    ): Promise<void> {
        if (type === "persistent" && !node) {
            throw new Error('Dedicated node required for persistent deployment');
        }

        try {
            await DeploymentManifestManager.createDeploymentManifest(name, type, node);

            let directoryPath = `/deployments/${name}`;
            if (type === 'persistent') {
                directoryPath = `/nodes/${node}/deployments/${name}`;
            }

            await sftpService.createSFTPDirectory(`nfsshare${directoryPath}`);
        } catch (error) {
            console.error(error);
            throw new Error('Failed to create deployment');
        }

        await this.runApplyScript();
        await this.sendProxyUpdate();
    }

    public async restartDeployment(name: string): Promise<void> {
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
            await retryOperation(() => this.setDeploymentState(name, false));
            await new Promise(resolve => setTimeout(resolve, 3000));
            await retryOperation(() => this.setDeploymentState(name, true));
        } catch (error) {
            console.error('error during restart:', error);
            throw error;
        }
    }

    public async deleteDeployment(name: string): Promise<void> {
        try {
            const { type, yamlContent } = await DeploymentManifestManager.deleteDeploymentManifest(name);

            let directoryPath = `/deployments/${name}`;
            if (type === 'persistent') {
                directoryPath = `/nodes/${yamlContent.dedicatedNode}/deployments/${name}`;
            }

            try {
                await sftpService.deleteSFTPDirectory(`nfsshare${directoryPath}`);
            } catch (sftpError) {
                console.error('Failed to delete SFTP directory:', sftpError);
            }
        } catch (error) {
            console.error(error);
            throw new Error('Failed to delete deployment');
        }

        await this.runApplyScript();
        await redisService.sendDeploymentUpdate();
    }

    private async runApplyScript(): Promise<void> {
        const scriptDir = path.join(config["bmc-path"], "scripts");
        await Util.safelyExecuteShellCommand(`cd "${scriptDir}" && ls && ./apply-deployments.sh`);
    }

    private async sendProxyUpdate(): Promise<void> {
        const client = await redisService.redisPool.acquire();
        client.publish('proxy-modified', 'update');
        await redisService.redisPool.release(client);
    }

    public static get(): DeploymentManager {
        if (!DeploymentManager.instance) {
            DeploymentManager.instance = new DeploymentManager();
        }
        return DeploymentManager.instance;
    }
}