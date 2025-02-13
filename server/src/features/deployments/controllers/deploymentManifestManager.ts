import path from 'path';
import config from '../../../config';
import {promises as fs, readdirSync, unlinkSync} from 'fs';
import yaml from 'js-yaml';
import Util from "../../../misc/util";
import {DEPLOYMENT_TYPES, DeploymentType, DeploymentValues, Manifest} from "../models/types";
import Deployment from "../models/deployment";

export default class DeploymentManifestManager {
    private static readonly baseDir: string = path.join(config["bmc-path"], "local/deployments");

    public static async createDeploymentManifest(
        name: string,
        type: DeploymentType,
        node?: string
    ): Promise<string> {
        const workingDir = path.join(this.baseDir, type);
        const defaultsDir = `${config["bmc-path"]}/defaults`;
        const defaultFile = path.join(defaultsDir, `${type}-deployment.yaml`);
        const filePath = path.join(workingDir, `${name}.yaml`);

        if (await Util.fileExists(filePath)) throw new Error('Deployment already exists');

        await fs.copyFile(defaultFile, filePath);
        let originalContent = await fs.readFile(defaultFile, 'utf8');
        const lines = originalContent.split('\n');

        const updatedLines = lines.map(line => {
            if (line.trim().startsWith('name:')) {
                return line.replace(/name:.*/, `name: "${name}"`);
            } else if (line.trim().startsWith('dataDirectory:')) {
                const indent = line.match(/^\s*/)[0];
                return `${indent}dataDirectory: "${name}"`;
            } else if (type === "persistent" && line.trim().startsWith('dedicatedNode:')) {
                const indent = line.match(/^\s*/)[0];
                return `${indent}dedicatedNode: "${node}"`;
            }
            return line;
        });

        const updatedContent = updatedLines.join('\n');
        await fs.writeFile(filePath, updatedContent, 'utf8');
        return filePath;
    }

    public static async deleteDeploymentManifest(deployment: Deployment) {
        const filePath = deployment.manifest.path;
        try {
            unlinkSync(filePath);
        } catch (error) {
            throw new Error('Failed to delete deployment file');
        }
    }

    public static async getAllManifests(): Promise<Manifest[]> {
        const manifests: Manifest[] = [];

        for (const type of DEPLOYMENT_TYPES) {
            const dirPath = path.join(this.baseDir, type);

            try {
                const files = readdirSync(dirPath);

                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const manifest = await this.getManifest(filePath);
                    if (manifest && !manifests.find(m => m.name === manifest.name)) {
                        manifests.push(manifest);
                    }
                }
            } catch (error) {
                console.error(`error reading ${type} manifests:`, error);
            }
        }

        return manifests;
    }

    public static async getManifest(filePath: string): Promise<Manifest | null> {
        try {
            if (!filePath.endsWith(".yaml")) {
                return null;
            }

            const name = path.basename(filePath).split(".")[0].replace(/^disabled-/, '');
            const type = this.getDeploymentType(filePath);
            const isEnabled = !path.basename(filePath).startsWith('disabled-');

            const fileContent = await fs.readFile(filePath, 'utf8');
            const yamlContent = yaml.load(fileContent) as DeploymentValues;

            return {
                name,
                path: filePath,
                content: yamlContent,
                isEnabled,
                type
            };
        } catch (error) {
            console.error(`error reading manifest ${filePath}:`, error);
            return null;
        }
    }

    public static async getDeploymentContent(deployment: Deployment): Promise<string> {
        return await fs.readFile(deployment.manifest.path, 'utf8');
    }

    public static async updateDeploymentContent(deployment: Deployment, content: string): Promise<void> {
        try {
            await fs.writeFile(deployment.manifest.path, content, 'utf8');
        } catch (error) {
            throw new Error('Failed to write deployment file');
        }
    }

    public static async updateDeploymentState(deployment: Deployment, enabled: boolean) {
        const filePath = deployment.manifest.path;
        const newFilePath = enabled
            ? filePath.replace('disabled-', '')
            : path.join(path.dirname(filePath), `disabled-${path.basename(filePath)}`);
        await fs.rename(filePath, newFilePath);
        deployment.manifest.path = newFilePath;
    }

    public static getDeploymentType(filePath: string): DeploymentType {
        return filePath.includes('/persistent/') ? 'persistent' : 'scalable';
    }
}