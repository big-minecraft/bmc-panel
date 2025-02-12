import path from 'path';
import config from '../../../config';
import {promises as fs, readdirSync, unlinkSync} from 'fs';
import yaml from 'js-yaml';
import {DeploymentPaths, DeploymentYaml} from "../models/deployment";
import Util from "../../../misc/util";

export const DEPLOYMENT_TYPES = ['persistent', 'scalable'] as const;
export type DeploymentType = typeof DEPLOYMENT_TYPES[number];

export const isDeploymentType = (type: string): type is DeploymentType => {
    return DEPLOYMENT_TYPES.includes(type as DeploymentType);
};

export interface ManifestFile {
    name: string;
    path: string;
    content: DeploymentYaml;
    isEnabled: boolean;
    type: DeploymentType;
}

export default class DeploymentManifestManager {
    private static readonly baseDir: string = path.join(config["bmc-path"], "local/deployments");

    public static async listManifestFiles(): Promise<ManifestFile[]> {
        const manifests: ManifestFile[] = [];

        for (const type of DEPLOYMENT_TYPES) {
            const dirPath = path.join(this.baseDir, type);

            try {
                const files = readdirSync(dirPath);

                for (const file of files) {
                    if (file.endsWith(".yaml")) {
                        const name = file.split(".")[0].replace(/^disabled-/, '');
                        const filePath = path.join(dirPath, file);
                        const isEnabled = !file.startsWith('disabled-');

                        const fileContent = await fs.readFile(filePath, 'utf8');
                        const yamlContent = yaml.load(fileContent) as DeploymentYaml;

                        const existingManifest = manifests.find(m => m.name === name);
                        if (!existingManifest) {
                            manifests.push({
                                name,
                                path: filePath,
                                content: yamlContent,
                                isEnabled,
                                type
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`Error reading ${type} manifests:`, error);
            }
        }

        return manifests;
    }

    public static async getDeploymentContent(name: string): Promise<string> {
        const filePath = await this.findDeploymentFile(name);
        return await fs.readFile(filePath, 'utf8');
    }

    public static async updateDeploymentContent(name: string, content: string): Promise<void> {
        const filePath = await this.findDeploymentFile(name);
        try {
            await fs.writeFile(filePath, content, 'utf8');
        } catch (error) {
            throw new Error('Failed to write deployment file');
        }
    }

    public static async updateDeploymentState(name: string, enabled: boolean): Promise<{filePath: string, yamlContent: DeploymentYaml}> {
        const filePath = await this.findDeploymentFile(name);
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

        return { filePath: newFilePath, yamlContent };
    }

    public static async createDeploymentManifest(
        name: string,
        type: DeploymentType,
        node?: string
    ): Promise<string> {
        const workingDir = path.join(this.baseDir, type);
        const defaultsDir = `${config["bmc-path"]}/defaults`;
        const sourceFile = path.join(defaultsDir, `${type}-deployment.yaml`);
        const destinationFile = path.join(workingDir, `${name}.yaml`);

        if (await Util.fileExists(destinationFile)) {
            throw new Error('Deployment already exists');
        }

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

        return destinationFile;
    }

    public static async deleteDeploymentManifest(name: string): Promise<{filePath: string, type: DeploymentType, yamlContent: DeploymentYaml}> {
        const filePath = await this.findDeploymentFile(name);
        const type = this.getDeploymentType(filePath);
        const config = await this.getDeploymentContent(name);
        const yamlContent = yaml.load(config) as DeploymentYaml;

        try {
            unlinkSync(filePath);
        } catch (error) {
            throw new Error('Failed to delete deployment file');
        }

        return { filePath, type, yamlContent };
    }

    public static async findDeploymentFile(name: string): Promise<string> {
        for (const type of DEPLOYMENT_TYPES) {
            for (const disabled of [false, true]) {
                const prefix = disabled ? 'disabled-' : '';
                const filePath = path.join(this.baseDir, type, `${prefix}${name}.yaml`);
                try {
                    await fs.readFile(filePath);
                    return filePath;
                } catch {
                    continue;
                }
            }
        }
        throw new Error('Deployment file not found');
    }

    public static getDeploymentType(filePath: string): 'persistent' | 'scalable' {
        return filePath.includes('/persistent/') ? 'persistent' : 'scalable';
    }
}