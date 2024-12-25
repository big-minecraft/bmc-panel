import JSZip from 'jszip';
import tar from 'tar';
import SevenZip from '7zip-min';
import {promisify} from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import * as unrar from 'node-unrar-js';
import {uploadSFTPFile} from './sftp';
import {downloadSFTPFile} from './sftp';

// Type definitions
type FileContent = Buffer | string;

interface ExtractedEntry {
    type: 'file' | 'directory';
    name: string;
    buffer?: Buffer;
}

// Helper functions
const createTempDir = async (): Promise<string> => {
    return await fs.mkdtemp(path.join(os.tmpdir(), 'sftp-extract-'));
};

const cleanupTempDir = async (tempPath: string): Promise<void> => {
    try {
        await fs.rm(tempPath, {recursive: true, force: true});
    } catch (error) {
        console.error('Error cleaning up temp directory:', error);
    }
};

const getDirectory = (filePath: string): string => path.dirname(filePath);

const ensureRemoteDirectory = async (dirPath: string): Promise<void> => {
    // Implementation of ensureRemoteDirectory should be provided in the SFTP module
    // This is just a placeholder type definition
};

// Archive handlers
const handleZip = async (fileBuffer: Buffer, originalPath: string): Promise<void> => {
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

const handleTar = async (tempFilePath: string, originalPath: string): Promise<void> => {
    const targetDir = getDirectory(originalPath);
    const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
    await fs.mkdir(tempExtractPath, {recursive: true});

    await tar.x({
        file: tempFilePath,
        cwd: tempExtractPath
    });

    const processDirectory = async (dir: string, baseDir: string): Promise<void> => {
        const entries = await fs.readdir(dir, {withFileTypes: true});

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

const handleGzip = async (tempFilePath: string, originalPath: string): Promise<void> => {
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

const handleRar = async (tempFilePath: string, originalPath: string): Promise<void> => {
    const targetDir = getDirectory(originalPath);
    const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
    await fs.mkdir(tempExtractPath, {recursive: true});

    const rarBuffer = await fs.readFile(tempFilePath);
    const extractor = await unrar.createExtractorFromData({
        data: rarBuffer
    });

    const list = extractor.extract();

    for (const file of list.files) {
        if (!file.fileHeader.flags.directory && file.extraction) {
            const targetPath = path.join(targetDir, file.fileHeader.name).replace(/\\/g, '/');
            await ensureRemoteDirectory(path.dirname(targetPath));
            await uploadSFTPFile(Buffer.from(file.extraction), targetPath);
        }
    }
};

const handleSevenZip = async (tempFilePath: string, originalPath: string): Promise<void> => {
    const targetDir = getDirectory(originalPath);
    const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
    await fs.mkdir(tempExtractPath, {recursive: true});

    await new Promise<void>((resolve, reject) => {
        SevenZip.unpack(tempFilePath, tempExtractPath, (err: Error | null) => {
            if (err) reject(err);
            else resolve();
        });
    });

    const processDirectory = async (dir: string, baseDir: string): Promise<void> => {
        const entries = await fs.readdir(dir, {withFileTypes: true});

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

async function unarchiveFile(filePath: string): Promise<void> {
    let tempDir: string | null = null;

    try {
        const fileBuffer = await downloadSFTPFile(filePath);
        tempDir = await createTempDir();
        const tempFilePath = path.join(tempDir, path.basename(filePath));
        await fs.writeFile(tempFilePath, fileBuffer);

        if (filePath.endsWith('.zip')) {
            await handleZip(fileBuffer, filePath);
        } else if (filePath.endsWith('.tar')) {
            await handleTar(tempFilePath, filePath);
        } else if (filePath.endsWith('.tar.gz') || filePath.endsWith('.gz')) {
            await handleGzip(tempFilePath, filePath);
        } else if (filePath.endsWith('.rar')) {
            await handleRar(tempFilePath, filePath);
        } else if (filePath.endsWith('.7z')) {
            await handleSevenZip(tempFilePath, filePath);
        } else {
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

export {
    unarchiveFile
};