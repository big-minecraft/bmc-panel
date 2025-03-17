import path from 'path';
import Util from "../../../misc/util";
import DeploymentManifestManager from './deploymentManifestManager';
import Deployment from '../models/deployment';
import {DeploymentType} from "../../../../../shared/enum/enums/deployment-type";
import {Enum} from "../../../../../shared/enum/enum";
import Redis from "ioredis";
import ConfigManager from "../../config/controllers/configManager";
import RedisService from "../../../services/redisService";
import KubernetesService from "../../../services/kubernetesService";
import SftpService from "../../../services/sftpService";

export default class DeploymentManager {
    private static deployments: Deployment[] = [];

    public static async init() {
        console.log("loading deployments");
        await this.loadDeployments();
        console.log("deployments loaded");
    }

    public static async loadDeployments() {
        await KubernetesService.getInstance().listNodeNames();
        const manifestFiles = await DeploymentManifestManager.getAllManifests();
        DeploymentManager.deployments = manifestFiles.map(manifest => new Deployment(manifest));
    }

    public static async createDeployment(
        name: string,
        type: DeploymentType,
        node?: string
    ): Promise<Deployment> {
        if (type == Enum.DeploymentType.PERSISTENT && !node) throw new Error('dedicated node required for persistent deployment');

        const manifestPath = await DeploymentManifestManager.createDeploymentManifest(name, type, node);
        const manifest = await DeploymentManifestManager.getManifest(manifestPath);
        const deployment = new Deployment(manifest);
        try {
            await SftpService.getInstance().createSFTPDirectory(`nfsshare${deployment.dataDirectory}`);
        } catch (error) {
            console.error(error)
            throw new Error('failed to create deployment')
        }

        await DeploymentManager.runApplyScript();
        await DeploymentManager.sendRedisUpdates("create");
        DeploymentManager.deployments.push(deployment);

        return deployment;
    }

    public static async deleteDeployment(name: string) {
        const deployment = this.getDeploymentByName(name);
        try {
            await DeploymentManifestManager.deleteDeploymentManifest(deployment);
        } catch (error) {
            console.error(error);
            throw new Error('failed to delete deployment manifest');
        }
        try {
            await SftpService.getInstance().deleteSFTPDirectory(`nfsshare${deployment.dataDirectory}`);
        } catch (error) {
            console.error(error);
            throw new Error('failed to delete sftp directory');
        }
        DeploymentManager.deployments = DeploymentManager.deployments.filter(testDeployment => testDeployment !== deployment);
        await DeploymentManager.runApplyScript();
        await DeploymentManager.sendRedisUpdates(name);
    }

    public static getDeploymentByName(name: string) {
        return this.getDeployments().find(deployment => deployment.name === name);
    }

    public static getDeployments(): Deployment[] {
        return DeploymentManager.deployments;
    }

    public static async runApplyScript(): Promise<void> {
        const scriptDir = path.join(ConfigManager.getString("bmc-path"), "scripts");
        await Util.safelyExecuteShellCommand(`cd "${scriptDir}" && ls && ./apply-deployments.sh`);
    }

    public static async sendRedisUpdates(deploymentName: string): Promise<void> {
        const client: Redis = await RedisService.getInstance().redisPool.acquire();
        try {
            await client.publish('deployment-modified', deploymentName);
        } finally {
            await RedisService.getInstance().redisPool.release(client);
        }
    }
}