const config = require('../config');
const path = require('path');
const { promises: { readFile, writeFile } } = require("fs");
const yaml = require('js-yaml');
const {scaleDeployment} = require("./k8s");
const {sendProxyUpdate} = require("./redis");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function getProxyConfig() {
    const workingDir = config["bmc-path"] + "/local";
    const filePath = path.join(workingDir, "proxy.yaml");

    try {
        const fileContent = await readFile(filePath, 'utf8');
        const yamlContent = yaml.load(fileContent);
        const isEnabled = !yamlContent.disabled;
        const dataDir = "/system/proxy"

        return {
            enabled: isEnabled,
            path: filePath,
            dataDirectory: dataDir
        };
    } catch (error) {
        throw new Error('Failed to read proxy configuration');
    }
}

async function getProxyContent() {
    const workingDir = config["bmc-path"] + "/local";
    const filePath = path.join(workingDir, "proxy.yaml");

    try {
        return await readFile(filePath, 'utf8');
    } catch (error) {
        console.error(error);
        throw new Error('Failed to read proxy configuration file');
    }
}

async function updateProxyContent(content) {
    const workingDir = config["bmc-path"] + "/local";
    const filePath = path.join(workingDir, "proxy.yaml");

    try {
        await writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error('Failed to write proxy configuration file');
    }

    await runApplyScript();
    await sendProxyUpdate();
}

async function toggleProxy(enabled) {
    const workingDir = config["bmc-path"] + "/local";
    const filePath = path.join(workingDir, "proxy.yaml");

    try {
        const fileContent = await readFile(filePath, 'utf8');
        const lines = fileContent.split('\n');

        const yamlContent = yaml.load(fileContent);

        const updatedLines = lines.map(line => {
            if (line.trim().startsWith('disabled:')) {
                return enabled ? null : 'disabled: true';
            }
            return line;
        })
            .filter(line => line !== null);

        if (!enabled && !lines.some(line => line.trim().startsWith('disabled:'))) {
            updatedLines.push('disabled: true');
        }

        const updatedContent = updatedLines.join('\n');
        await writeFile(filePath, updatedContent, 'utf8');

        if (enabled) {
            const minimumInstances = yamlContent.scaling.minInstances || 1;
            await scaleDeployment('proxy', minimumInstances);
        } else {
            await scaleDeployment('proxy', 0);
        }
    } catch (error) {
        console.error('Error in toggleProxy:', error);
        throw new Error('Failed to toggle proxy');
    }
}

async function restartProxy() {
    try {
        await scaleDeployment('proxy', 0);

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

async function runApplyScript() {
    const scriptDir = path.join(config["bmc-path"], "scripts");

    try {
        const { stdout, stderr } = await exec(`cd ${scriptDir} && ls && ./apply-proxy.sh`);
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
        }
    } catch (error) {
        console.error(`Script execution error: ${error}`);
        throw error;
    }
}

module.exports = {
    getProxyConfig,
    getProxyContent,
    updateProxyContent,
    toggleProxy,
    restartProxy
};