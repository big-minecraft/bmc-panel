import config from '../config';
import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import kubernetesClient from './k8s';
import { sendProxyUpdate } from './redis';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

interface ProxyConfig {
    enabled: boolean;
    path: string;
    dataDirectory: string;
}

interface ProxyYaml {
    disabled?: boolean;
    scaling: {
        minInstances?: number;
    };
}

async function getProxyConfig(): Promise<ProxyConfig> {
    const workingDir = `${config["bmc-path"]}/local`;
    const filePath = path.join(workingDir, "proxy.yaml");

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const yamlContent = yaml.load(fileContent) as ProxyYaml;
        const isEnabled = !yamlContent.disabled;
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
    const workingDir = `${config["bmc-path"]}/local`;
    const filePath = path.join(workingDir, "proxy.yaml");

    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(error);
        throw new Error('Failed to read proxy configuration file');
    }
}

async function updateProxyContent(content: string): Promise<void> {
    const workingDir = `${config["bmc-path"]}/local`;
    const filePath = path.join(workingDir, "proxy.yaml");

    try {
        await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error('Failed to write proxy configuration file');
    }

    await runApplyScript();
    await sendProxyUpdate();
}

async function toggleProxy(enabled: boolean): Promise<void> {
    const workingDir = `${config["bmc-path"]}/local`;
    const filePath = path.join(workingDir, "proxy.yaml");

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const lines = fileContent.split('\n');

        const yamlContent = yaml.load(fileContent) as ProxyYaml;

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
        await fs.writeFile(filePath, updatedContent, 'utf8');

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
        const { stdout, stderr } = await exec(`cd "${scriptDir}" && ls && ./apply-proxy.sh`);
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