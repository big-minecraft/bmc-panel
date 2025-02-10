import config from '../config';
import path from 'path';
import { readdirSync, unlinkSync, promises as fs } from 'fs';
import yaml from 'js-yaml';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import kubernetesService from "./kubernetesService";
import redisService from "./redisService";
import databaseService from "./databaseService";
import sftpService from "./sftpService";

const exec = promisify(execCallback);

interface DeploymentPaths {
    persistent: {
        enabled: string;
        disabled: string;
    };
    nonPersistent: {
        enabled: string;
        disabled: string;
    };
}

export interface Deployment {
    name: string;
    path: string;
    enabled: boolean;
    dataDirectory: string;
    type: 'persistent' | 'scalable';
}

export interface DeploymentYaml {
    volume: {
        dataDirectory?: string;
    };
    dedicatedNode?: string;
    scaling: {
        minInstances?: number;
    };
    queuing: {
        requireStartupConfirmation?: string;
    };
}

class DeploymentManager {
    private static instance: DeploymentManager;

    private constructor() {}

    public static getInstance(): DeploymentManager {
        if (!DeploymentManager.instance) {
            DeploymentManager.instance = new DeploymentManager();
        }
        return DeploymentManager.instance;
    }

    private getDeploymentFilePaths(name: string): DeploymentPaths {
        const baseDir = `${config["bmc-path"]}/local/deployments`;
        return {
            persistent: {
                enabled: path.join(baseDir, "persistent", `${name}.yaml`),
                disabled: path.join(baseDir, "persistent", `disabled-${name}.yaml`)
            },
            nonPersistent: {
                enabled: path.join(baseDir, "scalable", `${name}.yaml`),
                disabled: path.join(baseDir, "scalable", `disabled-${name}.yaml`)
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

    public async getDeployments(): Promise<Deployment[]> {
        const baseDir = path.join(config["bmc-path"], "local/deployments");
        const types: Array<'persistent' | 'scalable'> = ['persistent', 'scalable'];
        const deployments: Deployment[] = [];

        await kubernetesService.listNodeNames();

        for (const type of types) {
            const dirPath = path.join(baseDir, type);

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

    public async toggleDeployment(name: string, enabled: boolean): Promise<void> {
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

    public async restartDeployment(name: string): Promise<void> {
        try {
            await kubernetesService.scaleDeployment(name, 0);

            const deployment = await this.getDeploymentContent(name);
            const yamlContent = yaml.load(deployment) as DeploymentYaml;
            const minimumInstances = yamlContent.scaling.minInstances || 1;

            let retries = 3;
            while (retries > 0) {
                try {
                    await this.toggleDeployment(name, false);
                    break;
                } catch (err) {
                    retries--;
                    if (retries === 0) throw err;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            retries = 3;
            while (retries > 0) {
                try {
                    await this.toggleDeployment(name, true);
                    break;
                } catch (err) {
                    retries--;
                    if (retries === 0) throw err;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.error('Error during restart:', error);
            throw error;
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

        if (await this.fileExists(destinationFile)) {
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

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.readFile(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private async runApplyScript(): Promise<void> {
        const scriptDir = path.join(config["bmc-path"], "scripts");

        try {
            const { stdout, stderr } = await exec(`cd "${scriptDir}" && ls && ./apply-deployments.sh`);
            if (stderr) {
                console.error(`Script stderr: ${stderr}`);
            }
        } catch (error) {
            console.error(`Script execution error:`, error);
            throw error;
        }
    }

    private async sendProxyUpdate(): Promise<void> {
        const client = await redisService.redisPool.acquire();
        client.publish('proxy-modified', 'update');
        await redisService.redisPool.release(client);
    }
}

export default DeploymentManager.getInstance();