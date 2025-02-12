import config from '../../../config';
import path from 'path';
import {promises as fs, readdirSync, unlinkSync} from 'fs';
import yaml from 'js-yaml';
import kubernetesService from "../../../services/kubernetesService";
import redisService from "../../../services/redisService";
import sftpService from "../../../services/sftpService";
import {Deployment, DeploymentPaths, DeploymentYaml} from "../models/deployment";
import Util from "../../../misc/util";

export default class DeploymentManager {
    private static instance: DeploymentManager;
    private readonly baseDir: string;

    private constructor() {
        this.baseDir = path.join(config["bmc-path"], "local/deployments");
    }

    public async getDeployments(): Promise<Deployment[]> {
        const types: Array<'persistent' | 'scalable'> = ['persistent', 'scalable'];
        const deployments: Deployment[] = [];

        await kubernetesService.listNodeNames();

        for (const type of types) {
            const dirPath = path.join(this.baseDir, type);

            try {
                const files = readdirSync(dirPath);

                for (const file of files) {
                    if (file.endsWith(".yaml")) {
                        const name = file.split(".")[0].replace(/^disabled-/, '');
                        const filePath = path.join(dirPath, file);

                        const fileContent = await fs.readFile(filePath, 'utf8');
                        const yamlContent = yaml.load(fileContent) as DeploymentYaml;
                        const isEnabled = !file.startsWith('disabled-');

                        let dataDir = `/deployments/${yamlContent.volume.dataDirectory || name}`;

                        if (type === 'persistent') {
                            const node = yamlContent.dedicatedNode;
                            dataDir = `/nodes/${node}/deployments/${yamlContent.volume.dataDirectory || name}`;
                        }

                        const existingDeployment = deployments.find(g => g.name === name);
                        if (!existingDeployment) {
                            deployments.push({
                                name,
                                path: filePath,
                                enabled: isEnabled,
                                dataDirectory: dataDir,
                                type
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error reading ${type} deployments:`, error);
            }
        }

        return deployments;
    }

    public async getDeploymentContent(name: string): Promise<string> {
        const filePath = await this.findDeploymentFile(name);
        return await fs.readFile(filePath, 'utf8');
    }

    public async updateDeploymentContent(name: string, content: string): Promise<void> {
        const filePath = await this.findDeploymentFile(name);

        try {
            await fs.writeFile(filePath, content, 'utf8');
        } catch (error) {
            throw new Error('Failed to write deployment file');
        }

        await this.runApplyScript();
        await redisService.sendDeploymentUpdate();
    }

    public async setDeploymentState(name: string, enabled: boolean): Promise<void> {
        const filePath = await this.findDeploymentFile(name);
        const type = this.getDeploymentType(filePath);

        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const lines = fileContent.split('\n');

            const yamlContent = yaml.load(fileContent) as DeploymentYaml;

            const updatedLines = lines.map(line => {
                if (line.trim().startsWith('disabled:')) {
                    return enabled ? null : 'disabled: true';
                }
                return line;
            })
                .filter((line): line is string => line !== null);

            if (!enabled && !lines.some(line => line.trim().startsWith('disabled:'))) {
                updatedLines.push('disabled: true');
            }

            const updatedContent = updatedLines.join('\n');

            const newFilePath = enabled
                ? filePath.replace('disabled-', '')
                : path.join(path.dirname(filePath), `disabled-${path.basename(filePath)}`);

            await fs.writeFile(newFilePath, updatedContent, 'utf8');

            if (newFilePath !== filePath) {
                unlinkSync(filePath);
            }

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
        type: 'persistent' | 'scalable' = 'scalable',
        node?: string
    ): Promise<void> {
        const workingDir = path.join(config["bmc-path"], "local/deployments", type);
        const defaultsDir = `${config["bmc-path"]}/defaults`;
        const sourceFile = path.join(defaultsDir, `${type}-deployment.yaml`);
        const destinationFile = path.join(workingDir, `${name}.yaml`);

        if (await Util.fileExists(destinationFile)) {
            throw new Error('Deployment already exists');
        }

        if (type === "persistent" && !node) {
            throw new Error('Dedicated node required for persistent deployment');
        }

        try {
            await fs.copyFile(sourceFile, destinationFile);
            let originalContent = await fs.readFile(sourceFile, 'utf8');
            const lines = originalContent.split('\n');

            const updatedLines = lines.map(line => {
                if (line.trim().startsWith('name:')) {
                    return line.replace(/name:.*/, `name: "${name}"`);
                }
                if (line.trim().startsWith('dataDirectory:')) {
                    const indent = line.match(/^\s*/)[0];
                    return `${indent}dataDirectory: "${name}"`;
                }
                if (type === "persistent" && line.trim().startsWith('dedicatedNode:')) {
                    const indent = line.match(/^\s*/)[0];
                    return `${indent}dedicatedNode: "${node}"`;
                }
                return line;
            });

            const updatedContent = updatedLines.join('\n');
            await fs.writeFile(destinationFile, updatedContent, 'utf8');

            let directoryPath = `/deployments/${name}`;

            if (type === 'persistent') directoryPath = `/nodes/${node}/deployments/${name}`;

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
        const filePath = await this.findDeploymentFile(name);
        const type = this.getDeploymentType(filePath);

        const config = await this.getDeploymentContent(name);
        const yamlContent = yaml.load(config) as DeploymentYaml;

        try {
            unlinkSync(filePath);

            let directoryPath = `/deployments/${name}`;
            if (type === 'persistent') directoryPath = `/nodes/${yamlContent.dedicatedNode}/deployments/${name}`;

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

    private getDeploymentFilePaths(name: string): DeploymentPaths {
        return {
            persistent: {
                enabled: path.join(this.baseDir, "persistent", `${name}.yaml`),
                disabled: path.join(this.baseDir, "persistent", `disabled-${name}.yaml`)
            },
            nonPersistent: {
                enabled: path.join(this.baseDir, "scalable", `${name}.yaml`),
                disabled: path.join(this.baseDir, "scalable", `disabled-${name}.yaml`)
            }
        };
    }

    private async findDeploymentFile(name: string): Promise<string> {
        const paths = this.getDeploymentFilePaths(name);
        const allPaths = [
            ...Object.values(paths.persistent),
            ...Object.values(paths.nonPersistent)
        ];

        for (const filePath of allPaths) {
            try {
                await fs.readFile(filePath);
                return filePath;
            } catch {
                // Ignore and continue to the next path
            }
        }

        throw new Error('Deployment file not found');
    }

    private getDeploymentType(filePath: string): 'persistent' | 'scalable' {
        return filePath.includes('/persistent/') ? 'persistent' : 'scalable';
    }

    public static get(): DeploymentManager {
        if (!DeploymentManager.instance) {
            DeploymentManager.instance = new DeploymentManager();
        }
        return DeploymentManager.instance;
    }
}