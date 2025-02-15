import config from '../../../config';
import path from 'path';
import redisService from "../../../services/redisService";
import kubernetesService from "../../../services/kubernetesService";
import Util from "../../../misc/util";
import DeploymentManifestManager from './deploymentManifestManager';
import Deployment from '../models/deployment';
import sftpService from "../../../services/sftpService";
import {DeploymentType} from "../../../../../shared/enum/enums/deployment-type";
import {Enum} from "../../../../../shared/enum/enum";

export default class DeploymentManager {
    private static deployments: Deployment[] = [];

    public static async init() {
        console.log("loading deployments");
        await this.loadDeployments();
        console.log("deployments loaded");
    }

    public static async loadDeployments() {
        await kubernetesService.listNodeNames();
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
            await sftpService.createSFTPDirectory(`nfsshare${deployment.dataDirectory}`);
        } catch (error) {
            console.error(error)
            throw new Error('failed to create deployment')
        }

        await DeploymentManager.runApplyScript();
        await DeploymentManager.sendProxyUpdate();
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
            await sftpService.deleteSFTPDirectory(`nfsshare${deployment.dataDirectory}`);
        } catch (error) {
            console.error(error);
            throw new Error('failed to delete sftp directory');
        }
        DeploymentManager.deployments = DeploymentManager.deployments.filter(testDeployment => testDeployment !== deployment);
        await DeploymentManager.runApplyScript();
        await DeploymentManager.sendProxyUpdate();
    }

    public static getDeploymentByName(name: string) {
        return this.getDeployments().find(deployment => deployment.name === name);
    }

    public static getDeployments(): Deployment[] {
        return DeploymentManager.deployments;
    }

    static async runApplyScript(): Promise<void> {
        const scriptDir = path.join(config["bmc-path"], "scripts");
        await Util.safelyExecuteShellCommand(`cd "${scriptDir}" && ls && ./apply-deployments.sh`);
    }

    static async sendProxyUpdate(): Promise<void> {
        const client = await redisService.redisPool.acquire();
        client.publish('proxy-modified', 'update');
        await redisService.redisPool.release(client);
    }
}