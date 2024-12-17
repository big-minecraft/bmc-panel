const config = require('../config');
const path = require('path');
const { readdirSync, unlinkSync, promises: { readFile, writeFile, rename, copyFile } } = require("fs");
const yaml = require('js-yaml');
const kubernetesClient = require("./k8s");
const {createSFTPDirectory, deleteSFTPDirectory} = require("./sftp");
const util = require('util');
const {sendDeploymentUpdate, redisPool} = require("./redis");
const {createGrafanaDashboard, generateGrafanaSnapshot, listGrafanaDashboards, fetchGrafanaSnapshotImage,
    getPodCPUUsageForGraph, getPodMemoryUsageForGraph
} = require("./prometheus");
const exec = util.promisify(require('child_process').exec);

// Centralized method to get full path for a deployment file
function getDeploymentFilePaths(name) {
    const baseDir = config["bmc-path"] + "/local/deployments";
    return {
        persistent: {
            enabled: path.join(baseDir, "persistent", `${name}.yaml`),
            disabled: path.join(baseDir, "persistent", `disabled-${name}.yaml`)
        },
        nonPersistent: {
            enabled: path.join(baseDir, "non-persistent", `${name}.yaml`),
            disabled: path.join(baseDir, "non-persistent", `disabled-${name}.yaml`)
        }
    };
}

async function findDeploymentFile(name) {
    const paths = getDeploymentFilePaths(name);
    const allPaths = [
        ...Object.values(paths.persistent),
        ...Object.values(paths.nonPersistent)
    ];

    for (const filePath of allPaths) {
        try {
            await readFile(filePath);
            return filePath;
        } catch {}
    }

    throw new Error('Deployment file not found');
}

function getDeploymentType(filePath) {
    return filePath.includes('/persistent/') ? 'persistent' : 'non-persistent';
}

async function getDeployments() {
    const baseDir = path.join(config["bmc-path"], "local/deployments");
    const types = ['persistent', 'non-persistent'];
    let deployments = [];

    await kubernetesClient.listNodeNames();

    for (const type of types) {
        const dirPath = path.join(baseDir, type);

        try {
            const files = readdirSync(dirPath);

            for (const file of files) {
                if (file.endsWith(".yaml")) {
                    const name = file.split(".")[0].replace(/^disabled-/, '');
                    const filePath = path.join(dirPath, file);

                    const fileContent = await readFile(filePath, 'utf8');
                    const yamlContent = yaml.load(fileContent);
                    const isEnabled = !file.startsWith('disabled-');


                    let dataDir = `/deployments/${yamlContent.volume.dataDirectory || name}`;

                    if (type === 'persistent') {
                        let node = yamlContent.dedicatedNode;
                        dataDir = `/nodes/${node}/deployments/${yamlContent.volume.dataDirectory || name}`;
                    }

                    const existingDeployment = deployments.find(g => g.name === name);
                    if (!existingDeployment) {
                        deployments.push({
                            name: name,
                            path: filePath,
                            enabled: isEnabled,
                            dataDirectory: dataDir,
                            type: type
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Error reading ${type} deployments:`, error);
        }
    }

    return deployments;
}

async function getDeploymentContent(name) {
    const filePath = await findDeploymentFile(name);
    return await readFile(filePath, 'utf8');
}

async function updateDeploymentContent(name, content) {
    const filePath = await findDeploymentFile(name);

    try {
        await writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error('Failed to write deployment file');
    }

    await runApplyScript();
    await sendDeploymentUpdate();
}

async function toggleDeployment(name, enabled) {
    const filePath = await findDeploymentFile(name);
    const type = getDeploymentType(filePath);

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

        // Rename file if necessary
        const newFilePath = enabled
            ? filePath.replace('disabled-', '')
            : path.join(path.dirname(filePath), `disabled-${path.basename(filePath)}`);

        await writeFile(newFilePath, updatedContent, 'utf8');

        // Remove old file if renamed
        if (newFilePath !== filePath) {
            await unlinkSync(filePath);
        }

        if (enabled) {
            const minimumInstances = yamlContent.scaling.minInstances || 1;
            await kubernetesClient.scaleDeployment(name, minimumInstances);
        } else {
            await kubernetesClient.scaleDeployment(name, 0);
        }
    } catch (error) {
        console.error('Error in toggleDeployment:', error);
        throw new Error('Failed to toggle deployment');
    }
}

async function deleteDeployment(name)  {
    const filePath = await findDeploymentFile(name);
    const type = getDeploymentType(filePath);

    let config = await getDeploymentContent(name);
    let yamlContent = yaml.load(config);

    try {
        await unlinkSync(filePath);

        let directoryPath = `/deployments/${name}`;
        if (type === 'persistent') directoryPath = `/nodes/${yamlContent.dedicatedNode}/deployments/${name}`;

        await deleteSFTPDirectory(`nfsshare${directoryPath}`);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete deployment');
    }

    await runApplyScript();
    await sendDeploymentUpdate();
}

async function restartDeployment(name) {
    try {
        await kubernetesClient.scaleDeployment(name, 0);

        let deployment = await getDeploymentContent(name);
        let yamlContent = yaml.load(deployment);
        let minimumInstances = yamlContent.scaling.minInstances || 1;

        let retries = 3;
        while (retries > 0) {
            try {
                await toggleDeployment(name, false);
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
                await toggleDeployment(name, true);
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

async function createDeployment(name, type = 'non-persistent', node = null) {
    const workingDir = path.join(config["bmc-path"], "local/deployments", type);
    const defaultsDir = config["bmc-path"] + "/defaults";
    const sourceFile = path.join(defaultsDir, `${type}-deployment.yaml`);
    const destinationFile = path.join(workingDir, `${name}.yaml`);

    if (await fileExists(destinationFile)) {
        throw new Error('Deployment already exists');
    }

    if (type === "persistent" && !node) {
        throw new Error('Dedicated node required for persistent deployment');
    }

    try {
        await copyFile(sourceFile, destinationFile);
        let originalContent = await readFile(sourceFile, 'utf8');
        const lines = originalContent.split('\n');

        const updatedLines = lines.map(line => {
            if (line.trim().startsWith('name:')) {
                return line.replace(/name:.*/, `name: "${name}"`);
            }
            if (line.trim().startsWith('dataDirectory:')) {
                const indent = line.match(/^\s*/)[0];
                return `${indent}dataDirectory: "${name}"`;
            }
            if (type === "persistent" && line.trim().startsWith('dedicatedNode:')) {
                const indent = line.match(/^\s*/)[0];
                return `${indent}dedicatedNode: "${node}"`;
            }
            return line;
        });

        const updatedContent = updatedLines.join('\n');
        await writeFile(destinationFile, updatedContent, 'utf8');

        let directoryPath = `/deployments/${name}`;

        if (type === 'persistent') directoryPath = `/nodes/${node}/deployments/${name}`;

        await createSFTPDirectory(`nfsshare${directoryPath}`);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to create deployment');
    }

    await runApplyScript();
    await sendProxyUpdate();
}

async function fileExists(filePath) {
    try {
        await readFile(filePath);
        return true;
    } catch {
        return false;
    }
}

async function runApplyScript() {
    const scriptDir = path.join(config["bmc-path"], "scripts");

    try {
        const { stdout, stderr } = await exec(`cd "${scriptDir}" && ls && ./apply-deployments.sh`);
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
        }
    } catch (error) {
        console.error(`Script execution error: ${error}`);
        throw error;
    }
}

async function sendProxyUpdate() {
    const client = await redisPool.acquire();
    client.publish('proxy-modified', 'update');
    await redisPool.release(client);
}

module.exports = {
    getDeployments: getDeployments,
    getDeploymentContent: getDeploymentContent,
    updateDeploymentContent: updateDeploymentContent,
    toggleDeployment: toggleDeployment,
    deleteDeployment: deleteDeployment,
    createDeployment: createDeployment,
    restartDeployment: restartDeployment
};