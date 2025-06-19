import JSZip from 'jszip';
import tar from 'tar';
import SevenZip from '7zip-min';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import * as unrar from 'node-unrar-js';
import SFTPClient from "./sftpService";

// Type definitions
type FileContent = Buffer | string;

interface ExtractedEntry {
    type: 'file' | 'directory';
    name: string;
    buffer?: Buffer;
}

class Unarchiver {
    private static instance: Unarchiver;
    sftpService = SFTPClient.getInstance();

    private constructor() {}

    public static getInstance(): Unarchiver {
        return Unarchiver.instance;
    }

    public static init(): void {
        Unarchiver.instance = new Unarchiver();
    }

    private createTempDir = async (): Promise<string> => {
        return await fs.mkdtemp(path.join(os.tmpdir(), 'sftp-extract-'));
    };

    private cleanupTempDir = async (tempPath: string): Promise<void> => {
        try {
            await fs.rm(tempPath, { recursive: true, force: true });
        } catch (error) {
            console.error('Error cleaning up temp directory:', error);
        }
    };

    private getDirectory = (filePath: string): string => path.dirname(filePath);

    private ensureRemoteDirectory = async (dirPath: string): Promise<void> => {
        // Implementation of ensureRemoteDirectory should be provided in the SFTP module
        // This is just a placeholder type definition
    };

    private handleZip = async (fileBuffer: Buffer, originalPath: string): Promise<void> => {
        const zip = new JSZip();
        await zip.loadAsync(fileBuffer);
        const files = Object.keys(zip.files);
        const targetDir = this.getDirectory(originalPath);

        for (const file of files) {
            if (!zip.files[file].dir) {
                const content = await zip.files[file].async('nodebuffer');
                const fullTargetPath = path.join(targetDir, file).replace(/\\/g, '/');
                const targetDirPath = path.dirname(fullTargetPath);

                await this.sftpService.uploadSFTPFile(content, fullTargetPath);
            }
        }
    };

    private handleTar = async (tempFilePath: string, originalPath: string): Promise<void> => {
        const targetDir = this.getDirectory(originalPath);
        const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
        await fs.mkdir(tempExtractPath, { recursive: true });

        await tar.x({
            file: tempFilePath,
            cwd: tempExtractPath
        });

        const processDirectory = async (dir: string, baseDir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const sourcePath = path.join(dir, entry.name);
                const relativePath = path.relative(baseDir, sourcePath);
                const targetPath = path.join(targetDir, relativePath).replace(/\\/g, '/');

                if (entry.isDirectory()) {
                    await processDirectory(sourcePath, baseDir);
                } else {
                    const content = await fs.readFile(sourcePath);
                    await this.ensureRemoteDirectory(path.dirname(targetPath));
                    await this.sftpService.uploadSFTPFile(content, targetPath);
                }
            }
        };

        await processDirectory(tempExtractPath, tempExtractPath);
    };

    private handleGzip = async (tempFilePath: string, originalPath: string): Promise<void> => {
        const gunzip = promisify(zlib.gunzip);
        const fileContent = await fs.readFile(tempFilePath);
        const unzippedContent = await gunzip(fileContent);
        const targetDir = this.getDirectory(originalPath);

        if (originalPath.endsWith('.tar.gz')) {
            const tempUnzippedPath = tempFilePath.replace(/\.gz$/, '');
            await fs.writeFile(tempUnzippedPath, unzippedContent);
            await this.handleTar(tempUnzippedPath, originalPath.replace(/\.gz$/, ''));
        } else {
            const fileName = path.basename(originalPath).replace(/\.gz$/, '');
            const targetPath = path.join(targetDir, fileName).replace(/\\/g, '/');
            await this.ensureRemoteDirectory(targetDir);
            await this.sftpService.uploadSFTPFile(unzippedContent, targetPath);
        }
    };

    private handleRar = async (tempFilePath: string, originalPath: string): Promise<void> => {
        const targetDir = this.getDirectory(originalPath);
        const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
        await fs.mkdir(tempExtractPath, { recursive: true });

        const rarBuffer = await fs.readFile(tempFilePath);
        const extractor = await unrar.createExtractorFromData({
            data: rarBuffer
        });

        const list = extractor.extract();

        for (const file of list.files) {
            if (!file.fileHeader.flags.directory && file.extraction) {
                const targetPath = path.join(targetDir, file.fileHeader.name).replace(/\\/g, '/');
                await this.ensureRemoteDirectory(path.dirname(targetPath));
                await this.sftpService.uploadSFTPFile(Buffer.from(file.extraction), targetPath);
            }
        }
    };

    private handleSevenZip = async (tempFilePath: string, originalPath: string): Promise<void> => {
        const targetDir = this.getDirectory(originalPath);
        const tempExtractPath = path.join(path.dirname(tempFilePath), 'extracted');
        await fs.mkdir(tempExtractPath, { recursive: true });

        await new Promise<void>((resolve, reject) => {
            SevenZip.unpack(tempFilePath, tempExtractPath, (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const processDirectory = async (dir: string, baseDir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const sourcePath = path.join(dir, entry.name);
                const relativePath = path.relative(baseDir, sourcePath);
                const targetPath = path.join(targetDir, relativePath).replace(/\\/g, '/');

                if (entry.isDirectory()) {
                    await processDirectory(sourcePath, baseDir);
                } else {
                    const content = await fs.readFile(sourcePath);
                    await this.ensureRemoteDirectory(path.dirname(targetPath));
                    await this.sftpService.uploadSFTPFile(content, targetPath);
                }
            }
        };

        await processDirectory(tempExtractPath, tempExtractPath);
    };

    public async unarchiveFile(filePath: string): Promise<void> {
        console.log("222222222222222222")

        let tempDir: string | null = null;

        try {
            const fileBuffer = await this.sftpService.downloadSFTPFile(filePath);
            tempDir = await this.createTempDir();
            const tempFilePath = path.join(tempDir, path.basename(filePath));
            await fs.writeFile(tempFilePath, fileBuffer as Buffer);

            if (filePath.endsWith('.zip')) {
                await this.handleZip(fileBuffer as Buffer, filePath);
            } else if (filePath.endsWith('.tar')) {
                await this.handleTar(tempFilePath, filePath);
            } else if (filePath.endsWith('.tar.gz') || filePath.endsWith('.gz')) {
                await this.handleGzip(tempFilePath, filePath);
            } else if (filePath.endsWith('.rar')) {
                await this.handleRar(tempFilePath, filePath);
            } else if (filePath.endsWith('.7z')) {
                await this.handleSevenZip(tempFilePath, filePath);
            } else {
                throw new Error('Unsupported archive format');
            }
        } catch (error) {
            console.error('Error unarchiving file:', error);
            throw error;
        } finally {
            if (tempDir) {
                await this.cleanupTempDir(tempDir);
            }
        }
    }
}

export default Unarchiver