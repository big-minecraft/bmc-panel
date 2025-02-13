import config from '../../../config';
import path from 'path';
import redisService from "../../../services/redisService";
import kubernetesService from "../../../services/kubernetesService";
import Util from "../../../misc/util";
import DeploymentManifestManager from './deploymentManifestManager';
import Deployment from '../models/deployment';
import type { DeploymentType } from './deploymentManifestManager';
import {DeploymentYaml} from "../models/types";
import yaml from 'js-yaml';
import sftpService from "../../../services/sftpService";

export default class DeploymentManager {

    public static async getDeployments(): Promise<Deployment[]> {
        await kubernetesService.listNodeNames();
        const manifestFiles = await DeploymentManifestManager.listManifestFiles();

        return manifestFiles.map(manifest => {
            let dataDir = `/deployments/${manifest.content.volume.dataDirectory || manifest.name}`;

            if (manifest.type === 'persistent') {
                const node = manifest.content.dedicatedNode;
                dataDir = `/nodes/${node}/deployments/${manifest.content.volume.dataDirectory || manifest.name}`;
            }

            return new Deployment(
                manifest.name,
                manifest.path,
                manifest.type,
                manifest.isEnabled,
                dataDir
            );
        });
    }

    public static async create(
        name: string,
        type: DeploymentType,
        node?: string
    ): Promise<Deployment> {
        if (type === "persistent" && !node) {
            throw new Error('dedicated node required for persistent deployment')
        }

        const manifestPath = await DeploymentManifestManager.createDeploymentManifest(name, type, node);

        let directoryPath = `/deployments/${name}`;
        if (type === 'persistent') {
            directoryPath = `/nodes/${node}/deployments/${name}`;
        }

        try {
            await sftpService.createSFTPDirectory(`nfsshare${directoryPath}`);
        } catch (error) {
            console.error(error)
            throw new Error('failed to create deployment')
        }

        const deployment = new Deployment(
            name,
            manifestPath,
            type,
            true,
            directoryPath
        );

        await DeploymentManager.runApplyScript();
        await DeploymentManager.sendProxyUpdate();

        return deployment;
    }

    private static async runApplyScript(): Promise<void> {
        const scriptDir = path.join(config["bmc-path"], "scripts");
        await Util.safelyExecuteShellCommand(`cd "${scriptDir}" && ls && ./apply-deployments.sh`);
    }

    private static async sendProxyUpdate(): Promise<void> {
        const client = await redisService.redisPool.acquire();
        client.publish('proxy-modified', 'update');
        await redisService.redisPool.release(client);
    }

    public static async getDeploymentByName(name: string): Promise<Deployment> {
        const filePath = await DeploymentManifestManager.findDeploymentFile(name);
        const type = DeploymentManifestManager.getDeploymentType(filePath);
        const isEnabled = !filePath.includes('disabled-');

        let dataDir = `/deployments/${name}`;
        if (type === 'persistent') {
            const content = await DeploymentManifestManager.getDeploymentContent(name);
            const yamlContent = yaml.load(content) as DeploymentYaml;
            const node = yamlContent.dedicatedNode;
            dataDir = `/nodes/${node}/deployments/${name}`;
        }

        return new Deployment(
            name,
            filePath,
            type,
            isEnabled,
            dataDir
        );
    }
}