const Client = require('ssh2-sftp-client');
const sftp = new Client();
const config = require('../config.json');

const connectSftp = async () => {
    return sftp.connect({
        host: config.sftp.host,
        port: config.sftp.port,
        username: config.sftp.username,
        password: config.sftp.password
    });
};

const disconnectSftp = () => {
    return sftp.end();
};

async function listSFTPFiles(path) {
    try {
        await connectSftp();
        const list = await sftp.list(path);
        await disconnectSftp();
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
    }
}

async function getSFTPFileContent(path) {
    try {
        await connectSftp();
        const content = await sftp.get(path);
        await disconnectSftp();
        return content;
    } catch (error) {
        console.error('Error getting SFTP file content:', error);
        throw error;
    }
}

async function createSFTPFile(path, content) {
    try {
        await connectSftp();
        const buffer = Buffer.from(content);
        await sftp.put(buffer, path);
        await disconnectSftp();
        return { success: true, message: 'File created successfully' };
    } catch (error) {
        console.error('Error creating SFTP file:', error);
        throw error;
    }
}

async function updateSFTPFile(path, content) {
    try {
        await connectSftp();
        // Check if file exists
        const exists = await sftp.exists(path);
        if (!exists) {
            throw new Error('File does not exist');
        }
        // Update the file
        const buffer = Buffer.from(content);
        await sftp.put(buffer, path);
        await disconnectSftp();
        return { success: true, message: 'File updated successfully' };
    } catch (error) {
        console.error('Error updating SFTP file:', error);
        throw error;
    }
}

async function deleteSFTPFile(path) {
    console.log('Deleting file:', path);
    try {
        await connectSftp();
        await sftp.delete(path);
        await disconnectSftp();
        return { success: true, message: 'File deleted successfully' };
    } catch (error) {
        console.error('Error deleting SFTP file:', error);
        throw error;
    }
}

async function createSFTPDirectory(path) {
    try {
        await connectSftp();
        await sftp.mkdir(path, true); // true enables recursive creation
        await disconnectSftp();
        return { success: true, message: 'Directory created successfully' };
    } catch (error) {
        console.error('Error creating SFTP directory:', error);
        throw error;
    }
}

async function deleteSFTPDirectory(path) {
    try {
        await connectSftp();
        await sftp.rmdir(path, true);
        await disconnectSftp();
        return { success: true, message: 'Directory deleted successfully' };
    } catch (error) {
        console.error('Error deleting SFTP directory:', error);
        throw error;
    }
}

module.exports = {
    listSFTPFiles,
    getSFTPFileContent,
    createSFTPFile,
    updateSFTPFile,
    deleteSFTPFile,
    createSFTPDirectory,
    deleteSFTPDirectory
};