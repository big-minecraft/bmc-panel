const config = require('../config');
const path = require('path');
const { readdirSync, unlinkSync, promises: { readFile, writeFile, rename, copyFile } } = require("fs");
const yaml = require('js-yaml');
const {scaleDeployment} = require("./k8s");
const {createSFTPDirectory, deleteSFTPDirectory} = require("./sftp");

async function getGamemodes() {
    const workingDir = config["bmc-path"] + "/gamemodes";
    let gamemodes = [];

    try {
        const files = readdirSync(workingDir);

        for (const file of files) {
            if (file.endsWith(".yaml")) {
                const name = file.split(".")[0];
                const filePath = path.join(workingDir, file);

                const fileContent = await readFile (filePath, 'utf8');
                const yamlContent = yaml.load(fileContent);
                const isEnabled = !yamlContent.disabled;
                const dataDir = "/gamemodes/" + yamlContent.volume.dataDirectory || "/gamemodes";

                gamemodes.push({
                    name: name,
                    path: filePath,
                    enabled: isEnabled,
                    dataDirectory: dataDir
                });
            }
        }

        return gamemodes;
    } catch (error) {
        throw new Error('Failed to read gamemodes directory');
    }
}

async function getGamemodeContent(name) {
    const workingDir = config["bmc-path"] + "/gamemodes";
    let filePath = path.join(workingDir, `${name}.yaml`);

    if (!await fileExists(filePath)) {
        filePath = path.join(workingDir, `disabled-${name}.yaml`);
    }

    try {
        return await readFile(filePath, 'utf8');
    } catch (error) {
        console.error(error);
        throw new Error('Failed to read gamemode file');
    }
}

async function updateGamemodeContent(name, content) {
    const workingDir = config["bmc-path"] + "/gamemodes";
    let filePath = path.join(workingDir, `${name}.yaml`);

    if (!await fileExists(filePath)) {
        filePath = path.join(workingDir, `disabled-${name}.yaml`);
    }

    try {
        await writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error('Failed to write gamemode file');
    }

    await runApplyScript();
}

async function toggleGamemode(name, enabled) {
    const workingDir = config["bmc-path"] + "/gamemodes";
    const filePath = path.join(workingDir, `${name}.yaml`);

    try {
        let fileContent = await readFile(filePath, 'utf8');
        let yamlContent = yaml.load(fileContent);

        if (enabled) delete yamlContent.disabled;
        else yamlContent.disabled = true;

        fileContent = yaml.dump(yamlContent);
        await writeFile(filePath, fileContent, 'utf8');

        if (enabled) {
            const minimumInstances = yamlContent.minimumInstances || 1;
            await scaleDeployment(name, minimumInstances);
        } else {
            await scaleDeployment(name, 0);
        }
    } catch (error) {
        console.error('Error in toggleGamemode:', error);
        throw new Error('Failed to toggle gamemode');
    }

    // await runApplyScript();
}


async function deleteGamemode(name)  {
    const workingDir = config["bmc-path"] + "/gamemodes";
    const enabledPath = path.join(workingDir, `${name}.yaml`);
    const disabledPath = path.join(workingDir, `disabled-${name}.yaml`);

    try {
        if (await fileExists(enabledPath)) {
            await unlinkSync(enabledPath);
        } else if (await fileExists(disabledPath)) {
            await unlinkSync(disabledPath);
        }

        await deleteSFTPDirectory(`nfsshare/gamemodes/${name}`);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete gamemode');
    }

    await runApplyScript();
}

async function restartGamemode(name) {

    try {
        await scaleDeployment(name, 0);

        let gamemode = await getGamemodeContent(name);
        let yamlContent = yaml.load(gamemode);
        let minimumInstances = yamlContent.minimumInstances || 1;

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

async function createGamemode(name) {
    const yaml = require('js-yaml');
    const workingDir = config["bmc-path"] + "/gamemodes";
    const examplesDir = config["bmc-path"] + "/examples";
    const sourceFile = path.join(examplesDir, "example-gamemode.yaml");
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

        await createSFTPDirectory(`nfsshare/gamemodes/${name}`);
    } catch (error) {
        console.error(error);
        throw new Error('Failed to create gamemode');
    }

    await runApplyScript();
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
    const { exec } = require('child_process');
    const scriptDir = path.join(config["bmc-path"], "scripts");

    exec(`cd ${scriptDir} && ./apply.sh`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }

        // console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
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