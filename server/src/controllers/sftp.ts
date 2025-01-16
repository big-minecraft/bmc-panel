import Client from 'ssh2-sftp-client';
import config from '../config';
import genericPool from 'generic-pool';
import {Readable} from "node:stream";

const sftpPool = genericPool.createPool<Client>({
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

async function listSFTPFiles(path) {
    const { isText } = await import("istextorbinary")
    let sftp: Client;
    try {
        sftp = await sftpPool.acquire();
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
                    } else if (data instanceof WritableStream || data instanceof Readable) {
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
        if (sftp) sftpPool.release(sftp);
    }
}

async function getSFTPFileContent(path) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        const content = await sftp.get(path);
        return content;
    } catch (error) {
        console.error('Error getting SFTP file content:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function createSFTPFile(path, content) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        const buffer = Buffer.from(content);
        await sftp.put(buffer, path);
        return {success: true, message: 'File created successfully'};
    } catch (error) {
        console.error('Error creating SFTP file:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function updateSFTPFile(path, content) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        const exists = await sftp.exists(path);
        if (!exists) {
            throw new Error('File does not exist');
        }
        const buffer = Buffer.from(content);
        await sftp.put(buffer, path);
        return {success: true, message: 'File updated successfully'};
    } catch (error) {
        console.error('Error updating SFTP file:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function deleteSFTPFile(path) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        await sftp.delete(path);
        return {success: true, message: 'File deleted successfully'};
    } catch (error) {
        console.error('Error deleting SFTP file:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function createSFTPDirectory(path) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        await sftp.mkdir(path, true);
        return {success: true, message: 'Directory created successfully'};
    } catch (error) {
        console.error('Error creating SFTP directory:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function deleteSFTPDirectory(path) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        await sftp.rmdir(path, true);
        return {success: true, message: 'Directory deleted successfully'};
    } catch (error) {
        console.error('Error deleting SFTP directory:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function uploadSFTPBuffer(buffer, path) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        await sftp.put(buffer, path);
        return {success: true, message: 'File uploaded successfully'};
    } catch (error) {
        console.error('Error uploading SFTP buffer:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function uploadSFTPFiles(files, basePath) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        const uploadPromises = files.map(async (file) => {
            const remotePath = `${basePath}/${file.originalname}`.replace(/\/+/g, '/');
            await sftp.put(file.buffer, remotePath);
        });

        await Promise.all(uploadPromises);
        return {success: true, message: 'Files uploaded successfully'};
    } catch (error) {
        console.error('Error uploading SFTP files:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function ensureDirectoryExists(sftp, path) {
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

async function uploadSFTPFile(buffer, path) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();

        const directoryPath = path.substring(0, path.lastIndexOf('/'));

        await ensureDirectoryExists(sftp, directoryPath);

        if (Buffer.isBuffer(buffer)) {
            await sftp.put(buffer, path);
        } else if (Array.isArray(buffer)) {
            const uploadPromises = buffer.map(async (file) => {
                const remotePath = `${path}/${file.originalname}`.replace(/\/+/g, '/');
                const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
                await ensureDirectoryExists(sftp, remoteDir);
                await sftp.put(file.buffer, remotePath);
            });
            await Promise.all(uploadPromises);
        } else {
            throw new Error('Invalid input: expected Buffer or Array of files');
        }

        return {success: true, message: 'Upload successful'};
    } catch (error) {
        console.error('Error uploading SFTP file:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function downloadSFTPFile(path) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        const fileBuffer = await sftp.get(path);
        return fileBuffer;
    } catch (error) {
        console.error('Error downloading SFTP file:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function parseFormData(req) {
    return new Promise((resolve) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const data = Buffer.concat(chunks).toString();
            resolve(data);
        });
    });
}

async function moveFileOrFolder(sourcePath, destinationPath) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        await sftp.rename(sourcePath, destinationPath);
        return {success: true, message: 'File or folder moved successfully'};
    } catch (error) {
        console.error('Error moving file or folder:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function listSFTPRecursive(path) {
    const results = [];
    const contents = await listSFTPFiles(path);

    for (const item of contents) {
        if (item.type === 'd') {
            const subResults = await listSFTPRecursive(item.path);
            results.push(...subResults);
        } else {
            results.push(item);
        }
    }

    return results;
}

export {
    listSFTPFiles,
    getSFTPFileContent,
    createSFTPFile,
    updateSFTPFile,
    deleteSFTPFile,
    createSFTPDirectory,
    deleteSFTPDirectory,
    uploadSFTPFile,
    uploadSFTPFiles,
    uploadSFTPBuffer,
    downloadSFTPFile,
    parseFormData,
    moveFileOrFolder,
    listSFTPRecursive

};
