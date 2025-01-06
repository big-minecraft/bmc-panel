import config from '../config';
import path from 'path';
import {readdirSync, unlinkSync, promises as fs} from 'fs';
import yaml from 'js-yaml';
import kubernetesClient from './k8s';
import {sendProxyUpdate} from './redis';
import {promisify} from 'util';
import {exec as execCallback} from 'child_process';

const exec = promisify(execCallback);

interface ProxyConfig {
    enabled: boolean;
    path: string;
    dataDirectory: string;
}

interface ProxyYaml {
    scaling: {
        minInstances?: number;
    };
}

function getProxyFilePaths() {
    const baseDir = `${config["bmc-path"]}/local`;
    return {
        enabled: path.join(baseDir, "proxy.yaml"),
        disabled: path.join(baseDir, "disabled-proxy.yaml")
    };
}

async function findProxyFile(): Promise<string> {
    const paths = getProxyFilePaths();
    const allPaths = [paths.enabled, paths.disabled];

    for (const filePath of allPaths) {
        try {
            await fs.readFile(filePath);
            return filePath;
        } catch {
            continue;
        }
    }

    throw new Error('Proxy configuration file not found');
}

async function getProxyConfig(): Promise<ProxyConfig> {
    try {
        const filePath = await findProxyFile();
        const fileContent = await fs.readFile(filePath, 'utf8');
        const yamlContent = yaml.load(fileContent) as ProxyYaml;
        const isEnabled = !filePath.includes('disabled-');
        const dataDir = "/system/proxy";

        return {
            enabled: isEnabled,
            path: filePath,
            dataDirectory: dataDir
        };
    } catch (error) {
        throw new Error('Failed to read proxy configuration');
    }
}

async function getProxyContent(): Promise<string> {
    try {
        const filePath = await findProxyFile();
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(error);
        throw new Error('Failed to read proxy configuration file');
    }
}

async function updateProxyContent(content: string): Promise<void> {
    try {
        const filePath = await findProxyFile();
        await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error('Failed to write proxy configuration file');
    }

    await runApplyScript();
    await sendProxyUpdate();
}

async function toggleProxy(enabled: boolean): Promise<void> {
    try {
        const currentPath = await findProxyFile();
        const paths = getProxyFilePaths();
        const newPath = enabled ? paths.enabled : paths.disabled;

        const fileContent = await fs.readFile(currentPath, 'utf8');
        const yamlContent = yaml.load(fileContent) as ProxyYaml;

        // Only move the file if it's not already in the correct state
        if (currentPath !== newPath) {
            await fs.writeFile(newPath, fileContent, 'utf8');
            unlinkSync(currentPath);
        }

        if (enabled) {
            const minimumInstances = yamlContent.scaling.minInstances || 1;
            await kubernetesClient.scaleDeployment('proxy', minimumInstances);
        } else {
            await kubernetesClient.scaleDeployment('proxy', 0);
        }
    } catch (error) {
        console.error('Error in toggleProxy:', error);
        throw new Error('Failed to toggle proxy');
    }
}

async function restartProxy(): Promise<void> {
    try {
        await kubernetesClient.scaleDeployment('proxy', 0);

        let retries = 3;
        while (retries > 0) {
            try {
                await toggleProxy(false);
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
                await toggleProxy(true);
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

async function runApplyScript(): Promise<void> {
    const scriptDir = path.join(config["bmc-path"], "scripts");

    try {
        const {stdout, stderr} = await exec(`cd "${scriptDir}" && ls && ./apply-proxy.sh`);
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
        }
    } catch (error) {
        console.error(`Script execution error:`, error);
        throw error;
    }
}

export {
    getProxyConfig,
    getProxyContent,
    updateProxyContent,
    toggleProxy,
    restartProxy,
    ProxyConfig,
    ProxyYaml
};