import { LocalWorkspace, Stack } from "@pulumi/pulumi/automation";
import * as path from "path";
import { existsSync, mkdirSync } from "fs";
import ConfigManager from "../../features/config/controllers/configManager";
import { PulumiStackConfig } from "./types";

export class StateManager {
    private static instance: StateManager | null = null;
    private readonly config: PulumiStackConfig;

    private constructor() {
        const storagePath = ConfigManager.getString("storage-path");
        const statePath = path.join(storagePath, "pulumi-state");

        this.config = {
            projectName: "bmc-deployments",
            stackName: "default",
            statePath: statePath,
            passphrase: process.env.PULUMI_CONFIG_PASSPHRASE || "bmc-default-passphrase"
        };

        this.ensureStateDirectory();
    }


    public static getInstance(): StateManager {
        if (!StateManager.instance) StateManager.instance = new StateManager();

        return StateManager.instance;
    }

    private ensureStateDirectory(): void {
        if (!existsSync(this.config.statePath)) {
            mkdirSync(this.config.statePath, { recursive: true });
            console.log(`[Pulumi] Created state directory: ${this.config.statePath}`);
        }
    }

    public async createOrSelectStack(
        stackName: string,
        program: () => Promise<void>
    ): Promise<Stack> {
        try {
            const stack = await LocalWorkspace.createOrSelectStack({
                stackName: stackName,
                projectName: this.config.projectName,
                program: program
            }, {
                projectSettings: {
                    name: this.config.projectName,
                    runtime: "nodejs",
                    backend: {
                        url: `file://${this.config.statePath}`
                    }
                },
                envVars: {
                    PULUMI_CONFIG_PASSPHRASE: this.config.passphrase,
                    PULUMI_SKIP_UPDATE_CHECK: "true"
                }
            });

            console.log(`[Pulumi] Created/selected stack: ${stackName}`);
            return stack;
        } catch (error) {
            console.error(`[Pulumi] Failed to create/select stack ${stackName}:`, error);
            throw error;
        }
    }

    public static reset(): void {
        StateManager.instance = null;
    }
}
