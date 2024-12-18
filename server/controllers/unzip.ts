const JSZip = require('jszip');
const tar = require('tar');
const SevenZip = require('7zip-min');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { pipeline } = require('stream/promises');
const zlib = require('zlib');
const { createReadStream, createWriteStream } = require('fs');
const unrar = require('node-unrar-js');
const {uploadSFTPFile} = require("./sftp");
const {downloadSFTPFile} = require("./sftp");

const createTempDir = async () => {
    return await fs.mkdtemp(path.join(os.tmpdir(), 'sftp-extract-'));
};

const cleanupTempDir = async (tempPath) => {
    try {
        await fs.rm(tempPath, { recursive: true, force: true });
    } catch (error) {
        console.error('Error cleaning up temp directory:', error);
    }
};

const getDirectory = (filePath) => path.dirname(filePath);

const handleZip = async (fileBuffer, originalPath) => {
    const zip = new JSZip();
    await zip.loadAsync(fileBuffer);
    const files = Object.keys(zip.files);
    const targetDir = getDirectory(originalPath);

    for (const file of files) {
        if (!zip.files[file].dir) {
            const content = await zip.files[file].async('nodebuffer');
            const fullTargetPath = path.join(targetDir, file).replace(/\\/g, '/');
            const targetDirPath = path.dirname(fullTargetPath);

            await uploadSFTPFile(content, fullTargetPath);
        }
    }
};

const handleTar = async (tempFilePath, originalPath) => {
    const targetDir = getDirectory(originalPath);
    const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
    await fs.mkdir(tempExtractPath, { recursive: true });

    await tar.x({
        file: tempFilePath,
        cwd: tempExtractPath
    });

    const processDirectory = async (dir, baseDir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, sourcePath);
            const targetPath = path.join(targetDir, relativePath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                await processDirectory(sourcePath, baseDir);
            } else {
                const content = await fs.readFile(sourcePath);
                await ensureRemoteDirectory(path.dirname(targetPath));
                await uploadSFTPFile(content, targetPath);
            }
        }
    };

    await processDirectory(tempExtractPath, tempExtractPath);
};

const handleGzip = async (tempFilePath, originalPath) => {
    const gunzip = promisify(zlib.gunzip);
    const fileContent = await fs.readFile(tempFilePath);
    const unzippedContent = await gunzip(fileContent);
    const targetDir = getDirectory(originalPath);

    if (originalPath.endsWith('.tar.gz')) {
        const tempUnzippedPath = tempFilePath.replace(/\.gz$/, '');
        await fs.writeFile(tempUnzippedPath, unzippedContent);
        await handleTar(tempUnzippedPath, originalPath.replace(/\.gz$/, ''));
    } else {
        const fileName = path.basename(originalPath).replace(/\.gz$/, '');
        const targetPath = path.join(targetDir, fileName).replace(/\\/g, '/');
        await ensureRemoteDirectory(targetDir);
        await uploadSFTPFile(unzippedContent, targetPath);
    }
};

const handleRar = async (tempFilePath, originalPath) => {
    const targetDir = getDirectory(originalPath);
    const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
    await fs.mkdir(tempExtractPath, { recursive: true });

    const rarBuffer = await fs.readFile(tempFilePath);
    const extractor = await unrar.createExtractor({data: rarBuffer});

    for (const entry of extractor.extract()) {
        if (entry.type === 'file' && entry.buffer) {
            const targetPath = path.join(targetDir, entry.name).replace(/\\/g, '/');
            await ensureRemoteDirectory(path.dirname(targetPath));
            await uploadSFTPFile(entry.buffer, targetPath);
        }
    }
};

const handleSevenZip = async (tempFilePath, originalPath) => {
    const targetDir = getDirectory(originalPath);
    const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
    await fs.mkdir(tempExtractPath, { recursive: true });

    await new Promise((resolve, reject) => {
        SevenZip.unpack(tempFilePath, tempExtractPath, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    const processDirectory = async (dir, baseDir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(dir, entry.name);
            const relativePath = path.relative(baseDir, sourcePath);
            const targetPath = path.join(targetDir, relativePath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                await processDirectory(sourcePath, baseDir);
            } else {
                const content = await fs.readFile(sourcePath);
                await ensureRemoteDirectory(path.dirname(targetPath));
                await uploadSFTPFile(content, targetPath);
            }
        }
    };

    await processDirectory(tempExtractPath, tempExtractPath);
};

async function unarchiveFile(filePath) {
    let tempDir = null;

    try {
        const fileBuffer = await downloadSFTPFile(filePath);
        tempDir = await createTempDir();
        const tempFilePath = path.join(tempDir, path.basename(filePath));
        await fs.writeFile(tempFilePath, fileBuffer);

        if (filePath.endsWith('.zip')) {
            await handleZip(fileBuffer, filePath);
        }
        else if (filePath.endsWith('.tar')) {
            await handleTar(tempFilePath, filePath);
        }
        else if (filePath.endsWith('.tar.gz') || filePath.endsWith('.gz')) {
            await handleGzip(tempFilePath, filePath);
        }
        else if (filePath.endsWith('.rar')) {
            await handleRar(tempFilePath, filePath);
        }
        else if (filePath.endsWith('.7z')) {
            await handleSevenZip(tempFilePath, filePath);
        }
        else {
            throw new Error('Unsupported archive format');
        }
    } catch (error) {
        console.error('Error unarchiving file:', error);
        throw error;
    } finally {
        if (tempDir) {
            await cleanupTempDir(tempDir);
        }
    }
}

module.exports = {
    unarchiveFile
};