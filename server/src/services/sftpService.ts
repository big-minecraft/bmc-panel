import Client from 'ssh2-sftp-client';
import genericPool from 'generic-pool';
import {Readable} from 'node:stream';
import ConfigManager from "../features/config/controllers/configManager";
import {app} from "../app";
import {Enum} from "../../../shared/enum/enum";

class SFTPClient {
    private static instance: SFTPClient;
    private sftpPool: genericPool.Pool<Client>;

    private constructor() {
        let config = ConfigManager.getConfig();

        this.sftpPool = genericPool.createPool<Client>({
            create: async () => {
                const sftp = new Client();
                await sftp.connect({
                    host: config.sftp.host,
                    port: config.sftp.port,
                    username: config.sftp.username,
                    password: config.sftp.password
                });
                return sftp;
            },
            destroy: (sftp) => {
                return sftp.end();
            }
        }, {
            max: 10,
            min: 2
        });
    }

    public static getInstance(): SFTPClient {
        return SFTPClient.instance;
    }

    public static init(): void {
        SFTPClient.instance = new SFTPClient();
    }

    public async listSFTPFiles(path: string) {
        const { isText } = await import("istextorbinary")

        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            const list = await sftp.list(path);

            const processedFiles = await Promise.all(list.map(async item => {
                const fullPath = `${path}/${item.name}`.replace(/\/+/g, '/');

                let isTextFile = item.size == 0;
                if (item.type !== 'd' && item.size < 1024 * 100 && item.size > 0) {
                    try {
                        const data = await sftp.get(fullPath);
                        if (Buffer.isBuffer(data)) {
                            isTextFile = isText(null, data);
                            console.log("reading buffer")
                        } else if (typeof data === 'string') {
                            isTextFile = isText(null, Buffer.from(data, 'utf8'));
                            console.log("reading string")
                        } else if (data instanceof Readable) {
                            console.error(`skipping stream for ${fullPath}`);
                        } else {
                            console.error(`unexpected data type for ${fullPath}`);
                        }
                    } catch (readError) {
                        console.error(`error reading file ${fullPath}:`, readError);
                    }
                }

                return {
                    name: item.name,
                    type: item.type,
                    size: item.size,
                    modifyTime: item.modifyTime,
                    path: fullPath,
                    accessRights: item.rights,
                    isText: isTextFile
                };
            }));

            return processedFiles;
        } catch (error) {
            console.error('error listing sftp files:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async getSFTPFileContent(path: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            const content = await sftp.get(path);
            return content;
        } catch (error) {
            console.error('Error getting SFTP file content:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async createSFTPFile(path: string, content: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            const buffer = Buffer.from(content);
            await sftp.put(buffer, path);
            this.notifyClients();
            return { success: true, message: 'File created successfully' };
        } catch (error) {
            console.error('Error creating SFTP file:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async updateSFTPFile(path: string, content: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            const exists = await sftp.exists(path);
            if (!exists) {
                throw new Error('File does not exist');
            }
            const buffer = Buffer.from(content);
            await sftp.put(buffer, path);
            this.notifyClients();
            return { success: true, message: 'File updated successfully' };
        } catch (error) {
            console.error('Error updating SFTP file:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async deleteSFTPFile(path: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            await sftp.delete(path);
            this.notifyClients();
            return { success: true, message: 'File deleted successfully' };
        } catch (error) {
            console.error('Error deleting SFTP file:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async createSFTPDirectory(path: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            await sftp.mkdir(path, true);
            this.notifyClients();
            return { success: true, message: 'Directory created successfully' };
        } catch (error) {
            console.error('Error creating SFTP directory:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async deleteSFTPDirectory(path: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            await sftp.rmdir(path, true);
            this.notifyClients();
            return { success: true, message: 'Directory deleted successfully' };
        } catch (error) {
            console.error('Error deleting SFTP directory:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async uploadSFTPBuffer(buffer: Buffer, path: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            await sftp.put(buffer, path);
            this.notifyClients();
            return { success: true, message: 'File uploaded successfully' };
        } catch (error) {
            console.error('Error uploading SFTP buffer:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async uploadSFTPFiles(files: Array<{ originalname: string, buffer: Buffer }>, basePath: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            const uploadPromises = files.map(async (file) => {
                const remotePath = `${basePath}/${file.originalname}`.replace(/\/+/g, '/');
                await sftp.put(file.buffer, remotePath);
            });

            await Promise.all(uploadPromises);
            this.notifyClients();
            return { success: true, message: 'Files uploaded successfully' };
        } catch (error) {
            console.error('Error uploading SFTP files:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    private async ensureDirectoryExists(sftp: Client, path: string) {
        const segments = path.split('/').filter(segment => segment.length > 0);
        let currentPath = '/';

        for (const segment of segments) {
            currentPath = `${currentPath}${segment}/`.replace(/\/+/g, '/');
            try {
                const exists = await sftp.exists(currentPath);
                if (!exists) {
                    await sftp.mkdir(currentPath, true);
                }
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    throw error;
                }
            }
        }
    }

    public async uploadSFTPFile(buffer: Buffer | Array<{ originalname: string, buffer: Buffer }>, path: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();

            const directoryPath = path.substring(0, path.lastIndexOf('/'));

            await this.ensureDirectoryExists(sftp, directoryPath);

            if (Buffer.isBuffer(buffer)) {
                await sftp.put(buffer, path);
            } else if (Array.isArray(buffer)) {
                const uploadPromises = buffer.map(async (file) => {
                    const remotePath = `${path}/${file.originalname}`.replace(/\/+/g, '/');
                    const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
                    await this.ensureDirectoryExists(sftp, remoteDir);
                    await sftp.put(file.buffer, remotePath);
                });
                await Promise.all(uploadPromises);
            } else {
                throw new Error('Invalid input: expected Buffer or Array of files');
            }

            this.notifyClients();
            return { success: true, message: 'Upload successful' };
        } catch (error) {
            console.error('Error uploading SFTP file:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async createSFTPReadStream(path: string): Promise<{stream: Readable, release: () => void}> {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            const stream = sftp.createReadStream(path);

            const release = () => {
                if (sftp) this.sftpPool.release(sftp);
            };

            return { stream, release };
        } catch (error) {
            console.error('error creating sftp read stream:', error);
            if (sftp) await this.sftpPool.release(sftp);
            throw error;
        }
    }

    public async downloadSFTPFile(path: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            const fileBuffer = await sftp.get(path);
            return fileBuffer;
        } catch (error) {
            console.error('error downloading sftp file:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async parseFormData(req: any) {
        return new Promise((resolve) => {
            const chunks: any[] = [];
            req.on('data', (chunk: any) => chunks.push(chunk));
            req.on('end', () => {
                const data = Buffer.concat(chunks).toString();
                resolve(data);
            });
        });
    }

    public async moveFileOrFolder(sourcePath: string, destinationPath: string) {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            await sftp.rename(sourcePath, destinationPath);
            this.notifyClients();
            return { success: true, message: 'File or folder moved successfully' };
        } catch (error) {
            console.error('Error moving file or folder:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    public async listSFTPRecursive(path: string) {
        const results: any[] = [];
        const contents = await this.listSFTPFiles(path);

        for (const item of contents) {
            if (item.type === 'd') {
                const subResults = await this.listSFTPRecursive(item.path);
                results.push(...subResults);
            } else {
                results.push(item);
            }
        }

        return results;
    }

    public async statFile(path: string): Promise<Client.FileStats> {
        let sftp: Client;
        try {
            sftp = await this.sftpPool.acquire();
            return await sftp.stat(path);
        } catch (error) {
            console.error('error getting file stats:', error);
            throw error;
        } finally {
            if (sftp) this.sftpPool.release(sftp);
        }
    }

    private notifyClients() {
        console.log("Notifying clients of file sync");

        app.socketManager.sendAll(Enum.SocketMessageType.CLIENT_FILE_SYNC,
            {
                event: 'sync_started',
                success: true,
                'timestamp': new Date().toISOString(),
                details: 'File sync started'
            }
        );
    }
}

export default SFTPClient;