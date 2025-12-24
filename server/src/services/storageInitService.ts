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
        const storagePath = ConfigManager.getConfig()['storage-path'];

        console.log('Initializing storage at:', storagePath);

        // Create storage directory if it doesn't exist
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
            console.log('Created storage directory');
        }

        // Check if storage is already initialized by looking for specific files
        const gitFolder = path.join(storagePath, '.git');
        const isAlreadyInitialized = fs.existsSync(gitFolder);

        if (!isAlreadyInitialized) {
            await this.cloneBigMinecraft(storagePath);
        } else {
            console.log('Storage already initialized, skipping big-minecraft clone');
        }

        // Create manifests folder structure
        await this.createManifestsFolders(storagePath);

        console.log('Storage initialization complete');
    }

    private async cloneBigMinecraft(storagePath: string): Promise<void> {
        console.log('Cloning big-minecraft repository...');

        const tempDir = path.join(storagePath, 'temp-clone');

        try {
            // Clone into temp directory
            await execAsync(`git clone https://github.com/big-minecraft/big-minecraft "${tempDir}"`);

            // Move all files from temp directory to storage root
            const files = fs.readdirSync(tempDir);
            for (const file of files) {
                const sourcePath = path.join(tempDir, file);
                const destPath = path.join(storagePath, file);

                // Skip if already exists
                if (!fs.existsSync(destPath)) {
                    fs.renameSync(sourcePath, destPath);
                    console.log("Moving file:" + sourcePath + " -> " + destPath);
                }
            }

            // Remove temp directory
            fs.rmSync(tempDir, { recursive: true, force: true });

            console.log('big-minecraft repository cloned successfully');

            // Verify critical directories exist
            this.verifyCriticalDirectories(storagePath);

            console.log('Storage verification complete');
        } catch (error) {
            console.error('Failed to clone big-minecraft repository:', error);
            // Clean up temp directory if it exists
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            throw error;
        }
    }

    private verifyCriticalDirectories(storagePath: string): void {
        const criticalDirs = ['scripts', 'deployments', 'data'];
        const missingDirs: string[] = [];

        for (const dir of criticalDirs) {
            const dirPath = path.join(storagePath, dir);
            if (!fs.existsSync(dirPath)) {
                missingDirs.push(dir);
            }
        }

        if (missingDirs.length > 0) {
            console.warn('Warning: Some expected directories are missing:', missingDirs.join(', '));
        } else {
            console.log('All critical directories verified');
        }
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