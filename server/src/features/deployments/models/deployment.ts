import DeploymentManifestManager from '../controllers/deploymentManifestManager';
import {Manifest} from "./types";
import {DeploymentType} from "../../../../../shared/enum/enums/deployment-type";
import {Instance} from "../../../../../shared/model/instance";
import RedisService from "../../../services/redisService";
import { PulumiDeploymentService } from "../../../services/pulumi/pulumiDeploymentService";

export default class Deployment {
    public readonly name: string;
    public readonly manifest: Manifest;
    public readonly type: DeploymentType;
    private isEnabled: boolean;
    private sftpPort: number;

    constructor(manifest: Manifest) {
        this.name = manifest.name;
        this.manifest = manifest;
        this.type = manifest.type;
        this.isEnabled = manifest.isEnabled;
        this.sftpPort = manifest.sftpPort;
    }

    public async setEnabled(enabled: boolean): Promise<void> {
        try {
            await DeploymentManifestManager.updateDeploymentState(this, enabled);
            await RedisService.getInstance().setDeploymentEnabled(this.name, enabled);
            this.isEnabled = enabled;
        } catch (error) {
            console.error('error in setEnabled:', error)
            throw new Error('failed to set deployment state')
        }
    }

    public async restart(): Promise<void> {
        try {
            await RedisService.getInstance().sendRestartMessage(this.name);
        } catch (error) {
            console.error('error during restart:', error)
            throw error;
        }
    }

    public async getContent(): Promise<string> {
        return await DeploymentManifestManager.getDeploymentContent(this);
    }

    public getSftpPort(): number | undefined {
        return this.sftpPort;
    }

    public async updateContent(content: string): Promise<void> {
        await DeploymentManifestManager.updateDeploymentContent(this, content);

        const updatedManifest = await DeploymentManifestManager.getManifest(this.manifest.path);

        console.log(`[Deployment] Applying updated content for ${this.name} via Pulumi...`);
        const pulumiService = PulumiDeploymentService.getInstance();
        const result = await pulumiService.applySingleDeployment(updatedManifest);

        if (!result.success) {
            console.error(`[Deployment] Failed to apply updated content for ${this.name}:`, result.error);
            throw new Error(`Failed to apply updated content: ${result.error?.message}`);
        }

        console.log(`[Deployment] Updated content for ${this.name} applied successfully`);
    }

    public async getInstances(): Promise<Instance[]> {
        return await RedisService.getInstance().getInstances(this);
    }

    public toJSON() {
        return {
            name: this.name,
            enabled: this.isEnabled,
            typeIndex: this.type.getIndex(),
            path: this.manifest.path,
        };
    }
}