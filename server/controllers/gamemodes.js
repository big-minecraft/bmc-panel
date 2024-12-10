const config = require('../config');
const path = require('path');
const { readdirSync, unlinkSync, promises: { readFile, writeFile, rename, copyFile } } = require("fs");
const yaml = require('js-yaml');
const {scaleDeployment} = require("./k8s");
const {createSFTPDirectory, deleteSFTPDirectory} = require("./sftp");
const util = require('util');
const {sendGamemodeUpdate, redisPool} = require("./redis");
const exec = util.promisify(require('child_process').exec);

// Centralized method to get full path for a gamemode file
function getGamemodeFilePaths(name) {
    const baseDir = config["bmc-path"] + "/local/gamemodes";
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

// Helper to find existing gamemode file
async function findGamemodeFile(name) {
    const paths = getGamemodeFilePaths(name);
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

    throw new Error('Gamemode file not found');
}

// Helper to determine gamemode type
function getGamemodeType(filePath) {
    return filePath.includes('/persistent/') ? 'persistent' : 'non-persistent';
}

async function getGamemodes() {
    const baseDir = path.join(config["bmc-path"], "local/gamemodes");
    const types = ['persistent', 'non-persistent'];
    let gamemodes = [];

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
                    const dataDir = `/gamemodes/${type}/${yamlContent.volume.dataDirectory || name}`;

                    // Check if this gamemode is already in the list
                    const existingGamemode = gamemodes.find(g => g.name === name);
                    if (!existingGamemode) {
                        gamemodes.push({
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
            console.error(`Error reading ${type} gamemodes:`, error);
        }
    }

    return gamemodes;
}

async function getGamemodeContent(name) {
    const filePath = await findGamemodeFile(name);
    return await readFile(filePath, 'utf8');
}

async function updateGamemodeContent(name, content) {
    const filePath = await findGamemodeFile(name);

    try {
        await writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error('Failed to write gamemode file');
    }

    await runApplyScript();
    await sendGamemodeUpdate();
}

async function toggleGamemode(name, enabled) {
    const filePath = await findGamemodeFile(name);
    const type = getGamemodeType(filePath);

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
            await scaleDeployment(name, minimumInstances);
        } else {
            await scaleDeployment(name, 0);
        }
    } catch (error) {
        console.error('Error in toggleGamemode:', error);
        throw new Error('Failed to toggle gamemode');
    }
}

async function deleteGamemode(name)  {
    const filePath = await findGamemodeFile(name);
    const type = getGamemodeType(filePath);

    try {
        await unlinkSync(filePath);
        await deleteSFTPDirectory(`nfsshare/gamemodes/${type}/${name}`);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete gamemode');
    }

    await runApplyScript();
    await sendGamemodeUpdate();
}

async function restartGamemode(name) {
    try {
        await scaleDeployment(name, 0);

        let gamemode = await getGamemodeContent(name);
        let yamlContent = yaml.load(gamemode);
        let minimumInstances = yamlContent.scaling.minInstances || 1;

        let retries = 3;
        while (retries > 0) {
            try {
                await toggleGamemode(name, false);
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
                await toggleGamemode(name, true);
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

async function createGamemode(name, type = 'persistent') {
    const workingDir = path.join(config["bmc-path"], "local/gamemodes", type);
    const defaultsDir = config["bmc-path"] + "/defaults";
    const sourceFile = path.join(defaultsDir, `${type}-gamemode.yaml`);
    const destinationFile = path.join(workingDir, `${name}.yaml`);

    if (await fileExists(destinationFile)) {
        throw new Error('Gamemode already exists');
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
            return line;
        });

        const updatedContent = updatedLines.join('\n');
        await writeFile(destinationFile, updatedContent, 'utf8');

        //TODO: Pick a node for persistent gamemodes
        await createSFTPDirectory(`nfsshare/gamemodes/${name}`);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to create gamemode');
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
        const { stdout, stderr } = await exec(`cd ${scriptDir} && ls && ./apply-gamemodes.sh`);
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
    getGamemodes,
    getGamemodeContent,
    updateGamemodeContent,
    toggleGamemode,
    deleteGamemode,
    createGamemode,
    restartGamemode
};