import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import ConfigManager from '../features/config/controllers/configManager';
import { Enum } from '../../../shared/enum/enum';

const execAsync = promisify(exec);

export class StorageInitService {
    private static instance: StorageInitService;

    private constructor() {}

    public static getInstance(): StorageInitService {
        return StorageInitService.instance;
    }

    public static async init(): Promise<void> {
        StorageInitService.instance = new StorageInitService();
        await StorageInitService.instance.initializeStorage();
    }

    private async initializeStorage(): Promise<void> {
        const storagePath = ConfigManager.getConfig().panel.storagePath;

        console.log('Initializing storage at:', storagePath);

        // Create storage directory if it doesn't exist
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
            console.log('Created storage directory');
        }

        this.verifyRuntimeCharts();

        // Create manifests folder structure
        await this.createManifestsFolders(storagePath);

        console.log('Storage initialization complete');
    }

    private verifyRuntimeCharts(): void {
        const chartsPath = process.env.BMC_RUNTIME_CHARTS_PATH
            || path.join(ConfigManager.getConfig().panel.storagePath, 'chart-templates');
        const valuesPath = process.env.BMC_DEFAULT_VALUES_PATH
            || path.join(ConfigManager.getConfig().panel.storagePath, 'default-values');

        const requiredCharts = [
            'proxy-chart',
            'scalable-deployment-chart',
            'persistent-deployment-chart',
            'process-chart',
            'file-session-chart'
        ];

        const missing: string[] = [];
        if (!fs.existsSync(chartsPath)) missing.push(chartsPath);
        else {
            for (const chart of requiredCharts) {
                if (!fs.existsSync(path.join(chartsPath, chart, 'Chart.yaml'))) {
                    missing.push(path.join(chartsPath, chart));
                }
            }
        }
        if (!fs.existsSync(valuesPath)) missing.push(valuesPath);

        if (missing.length > 0) {
            console.error('Runtime charts are missing or incomplete:');
            for (const m of missing) console.error(`  - ${m}`);
            console.error('These ship with bmc-chart and are mounted by the panel Deployment.');
            console.error('Check the <release>-runtime-charts ConfigMap and the panel volume mounts.');
            throw new Error(`Runtime charts unavailable at ${chartsPath} - refusing to start`);
        }

        console.log(`Runtime charts verified at ${chartsPath}`);
    }

    private async createManifestsFolders(storagePath: string): Promise<void> {
        console.log('Creating manifests folder structure...');

        const manifestsPath = path.join(storagePath, 'manifests');

        // Create manifests folder if it doesn't exist
        if (!fs.existsSync(manifestsPath)) {
            fs.mkdirSync(manifestsPath);
            console.log('Created manifests folder');
        }

        // Get all deployment types from enum
        const deploymentTypes = Enum.DeploymentType.values();

        // Create a subfolder for each deployment type
        for (const deploymentType of deploymentTypes) {
            const typeFolder = path.join(manifestsPath, deploymentType.identifier);

            if (!fs.existsSync(typeFolder)) {
                fs.mkdirSync(typeFolder, { recursive: true });
                console.log(`Created manifests/${deploymentType.identifier} folder`);
            }
        }

        console.log('Manifests folder structure created');
    }
}

export default StorageInitService;