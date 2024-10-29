const Client = require('ssh2-sftp-client');
const config = require('../config.json');
const multer = require('multer');
const genericPool = require('generic-pool');

// Create a connection pool
const sftpPool = genericPool.createPool({
    create: () => {
        const sftp = new Client();
        return sftp.connect({
            host: config.sftp.host,
            port: config.sftp.port,
            username: config.sftp.username,
            password: config.sftp.password
        }).then(() => sftp);
    },
    destroy: (sftp) => {
        return sftp.end();
    }
}, {
    max: 10, // Adjust pool size based on your needs
    min: 2
});

async function listSFTPFiles(path) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        const list = await sftp.list(path);
        return list.map(item => ({
            name: item.name,
            type: item.type,
            size: item.size,
            modifyTime: item.modifyTime,
            path: `${path}/${item.name}`.replace(/\/+/g, '/'),
            accessRights: item.rights
        }));
    } catch (error) {
        console.error('Error listing SFTP files:', error);
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
        return { success: true, message: 'File created successfully' };
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
        return { success: true, message: 'File updated successfully' };
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
        return { success: true, message: 'File deleted successfully' };
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
        return { success: true, message: 'Directory created successfully' };
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
        return { success: true, message: 'Directory deleted successfully' };
    } catch (error) {
        console.error('Error deleting SFTP directory:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

async function uploadSFTPFile(files, basePath) {
    let sftp;
    try {
        sftp = await sftpPool.acquire();
        const uploadPromises = files.map(async (file) => {
            const remotePath = `${basePath}/${file.originalname}`.replace(/\/+/g, '/');
            await sftp.put(file.buffer, remotePath);
        });

        await Promise.all(uploadPromises);
        return { success: true, message: 'Files uploaded successfully' };
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
        return { success: true, message: 'File or folder moved successfully' };
    } catch (error) {
        console.error('Error moving file or folder:', error);
        throw error;
    } finally {
        if (sftp) sftpPool.release(sftp);
    }
}

module.exports = {
    listSFTPFiles,
    getSFTPFileContent,
    createSFTPFile,
    updateSFTPFile,
    deleteSFTPFile,
    createSFTPDirectory,
    deleteSFTPDirectory,
    uploadSFTPFile,
    downloadSFTPFile,
    parseFormData,
    moveFileOrFolder,

};
