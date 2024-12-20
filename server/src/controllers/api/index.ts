import multer from 'multer';
import JSZip from 'jszip';
import { getInstances, getProxies } from '../redis';
import {
    getDeployments,
    getDeploymentContent,
    updateDeploymentContent,
    toggleDeployment,
    deleteDeployment,
    createDeployment,
    restartDeployment
} from '../deployments';
import {
    register,
    verify,
    verifyLogin,
    login
} from '../authentication';
import {
    getInviteCodes,
    createInviteCode,
    revokeInviteCode,
    getUsers,
    setAdmin,
    resetPassword,
    deleteUser,
    logout,
    getUser,
    getUserByID
} from '../database';
import { verifyInvite } from '../inviteCodes';
import {
    deleteSFTPDirectory,
    createSFTPDirectory,
    deleteSFTPFile,
    updateSFTPFile,
    createSFTPFile,
    listSFTPFiles,
    getSFTPFileContent,
    downloadSFTPFile,
    uploadSFTPFile,
    moveFileOrFolder,
    listSFTPRecursive
} from '../sftp';
import config from '../../config';
import { unarchiveFile } from '../unzip';
import {
    getProxyContent,
    updateProxyContent,
    toggleProxy,
    restartProxy,
    getProxyConfig
} from '../proxy';
import {createDatabase, deleteDatabase, listDatabases, resetDatabasePassword} from '../databaseService';
import kubernetesClient from '../k8s';
import {
    getPodCPUUsageForGraph,
    getPodMemoryUsageForGraph
} from '../prometheus';
import {createK8sDashboardToken, deleteK8sDashboardToken, getK8sDashboardToken} from "../k8sdash";

const api = {
    getInstances: async (req, res) => {
        const instances = await getInstances();
        res.json(instances);
    },

    getProxies: async (req, res) => {
        const proxies = await getProxies();
        res.json(proxies);
    },

    getDeployments: async (req, res) => {
        try {
            const deployments = await getDeployments();
            res.json(deployments);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch deployments' });
        }
    },

    getDeploymentContent: async (req, res) => {
        try {
            const { name } = req.params;
            const content = await getDeploymentContent(name);
            res.json({ content });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch deployment content' });
        }
    },

    updateDeploymentContent: async (req, res) => {
        try {
            const { name } = req.params;
            const { content } = req.body;
            await updateDeploymentContent(name, content);
            res.json({ message: 'Deployment updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update deployment' });
        }
    },

    toggleDeployment: async (req, res) => {
        try {
            const { name } = req.params;
            const { enabled } = req.body;
            await toggleDeployment(name, enabled);
            res.json({ message: 'Deployment toggled successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to toggle deployment' });
        }
    },

    deleteDeployment: async (req, res) => {
        try {
            const {name} = req.params;
            await deleteDeployment(name);
            res.json({message: 'Deployment deleted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to delete deployment'});
        }
    },

    createDeployment: async (req, res) => {
        try {
            const name = req.body.name;
            const type = req.body.type;
            const node = req.body.node;

            await createDeployment(name, type, node);
            res.json({message: 'Deployment created successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to create deployment'});
        }
    },

    restartDeployment: async (req, res) => {
        try {
            const {name} = req.params;
            await restartDeployment(name);
            res.json({message: 'Deployment restarted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to restart deployment'});
        }
    },

    getProxyConfig: async (req, res) => {
        try {
            const proxy = await getProxyConfig();
            res.json(proxy);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch proxy' });
        }
    },

    getProxyContent: async (req, res) => {
        try {
            const content = await getProxyContent();
            res.json({ content });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch proxy content' });
        }
    },

    updateProxyContent: async (req, res) => {
        try {
            const { content } = req.body;
            await updateProxyContent(content);
            res.json({ message: 'Proxy updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update proxy' });
        }
    },

    toggleProxy: async (req, res) => {
        try {
            const { enabled } = req.body;
            await toggleProxy(enabled);
            res.json({ message: 'Proxy toggled successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to toggle proxy' });
        }
    },

    restartProxy: async (req, res) => {
        try {
            await restartProxy();
            res.json({message: 'Proxy restarted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to restart proxy'});
        }
    },

    register: async (req, res) => {
        const { username, password, inviteToken } = req.body;
        try {
            const data_url = await register(username, password, inviteToken);
            res.json({ message: 'User registered successfully', qrCode: data_url });
        } catch (error) {
            if (error.message === 'User already exists') {
                return res.status(400).json({ error: 'User already exists' });
            }

            res.status(500).json({ error: 'Failed to register user' });
        }
    },

    verify: async (req, res) => {
        const { username, token, inviteToken } = req.body;
        try {
            const loginToken = await verify(username, token, inviteToken);
            let dbUser = await getUser(username);
            let isAdmin = dbUser.is_admin;
            res.json({ loginToken, isAdmin });
        } catch (error) {
            res.status(500).json({ error: 'Failed to verify token' });
        }
    },

    login: async (req, res) => {
        const { username, password } = req.body;
        try {
            const sessionToken = await login(username, password);
            res.json({ sessionToken });
        } catch (error) {
            res.status(500).json({ error: 'Failed to login' });
        }
    },

    verifyLogin: async (req, res) => {
        const { username, token, sessionToken } = req.body;
        try {
            const loginToken = await verifyLogin(username, token, sessionToken);
            let dbUser = await getUser(username);
            let isAdmin = dbUser.is_admin;

            res.json({ verified: true, token: loginToken, isAdmin: isAdmin });
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to verify login' });
        }
    },

    getInviteCodes: async (req, res) => {
        try {
            const codes = await getInviteCodes();
            res.json(codes);
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to fetch invite codes'});
        }
    },

    createInviteCode: async (req, res) => {
        const {message} = req.body;
        try {
            await createInviteCode(message);
            res.json({message: 'Invite code created successfully'});
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to create invite code'});
        }
    },

    revokeInviteCode: async (req, res) => {
        const {code} = req.params;
        try {
            await revokeInviteCode(code);
            res.json({message: 'Invite code revoked successfully'});
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to revoke invite code'});
        }
    },

    verifyInvite: async (req, res) => {
        const {inviteCode} = req.body;
        try {
            let token = await verifyInvite(inviteCode);
            res.json({ token });
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Invalid invite code'});
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await getUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({error: 'Failed to fetch users'});
        }
    },

    async setAdmin(req, res) {
        const {id} = req.params;
        const {is_admin} = req.body;

        try {
            await setAdmin(id, is_admin);
            let dbUser = await getUserByID(id);
            await logout(dbUser.username);

            res.json({message: 'Updated user admin status'});
        } catch (error) {
            res.status(500).json({error: 'Failed to set user admin status'});
        }
    },

    async resetPassword(req, res) {
        const {id} = req.params;
        const {password} = req.body;

        try {
            await resetPassword(id, password);
            res.json({message: 'Password reset successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to reset password'});
        }
    },

    async deleteUser(req, res) {
        const {id} = req.params;

        try {
            await deleteUser(id);
            res.json({message: 'User deleted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to delete user'});
        }
    },

    async logout(req, res) {
        try {
            await logout(req.user.username);
        } catch (error) {
            res.status(500).json({error: 'Failed to log out user'});
        }

        res.json({message: 'Logged out successfully'});
    },

    async getK8sDashboardToken(req, res) {
        try {
            const token = await getK8sDashboardToken();
            res.json({token});
        } catch (error) {
            res.status(500).json({error: 'Failed to get k8s dashboard token'});
        }
    },

    async createK8sDashboardToken(req, res) {
        try {
            const token = await createK8sDashboardToken();
            res.json({token});
        } catch (error) {
            res.status(500).json({error: 'Failed to create k8s dashboard token'});
        }
    },

    async deleteK8sDashboardToken(req, res) {
        try {
            await deleteK8sDashboardToken();
            res.json({message: 'Token deleted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to delete k8s dashboard token'});
        }
    },

    getSFTPFiles: async (req, res) => {
        const { path } = req.query;

        try {
            const files = await listSFTPFiles(path);
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list files' });
        }
    },

    getSFTPFileContent: async (req, res) => {
        const { path } = req.query;

        try {
            const fileContent = await getSFTPFileContent(path);
            res.json({ content: fileContent });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get file content' });
        }
    },

    createSFTPFile: async (req, res) => {
        const { path, content } = req.body;
        try {
            await createSFTPFile(path, content);
            res.json({ message: 'File created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create file' });
        }
    },

    updateSFTPFile: async (req, res) => {
        const { path, content } = req.body;
        try {
            await updateSFTPFile(path, content);
            res.json({ message: 'File updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update file' });
        }
    },

    deleteSFTPFile: async (req, res) => {
        const { path } = req.query;
        try {
            await deleteSFTPFile(path);
            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete file' });
        }
    },

    createSFTPDirectory: async (req, res) => {
        const { path } = req.body;
        try {
            await createSFTPDirectory(path);
            res.json({ message: 'Directory created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create directory' });
        }
    },

    deleteSFTPDirectory: async (req, res) => {
        const { path } = req.query;
        try {
            await deleteSFTPDirectory(path);
            res.json({ message: 'Directory deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete directory' });
        }
    },

    uploadSFTPFiles: async (req, res) => {
        const storage = multer.memoryStorage();
        const upload = multer({
            storage: storage,
            limits: {
                fileSize: config["max-upload-size-mb"] * 1024 * 1024
            }
        }).array('files');

        try {
            await new Promise<void>((resolve, reject) => {
                upload(req, res, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            if (!req.files?.length) {
                return res.status(400).json({ error: 'No files provided' });
            }

            await uploadSFTPFile(req.files, req.body.path);
            res.json({ message: 'Files uploaded successfully' });
        } catch (error) {
            console.error('Error in upload process:', error);
            res.status(500).json({ error: 'Failed to upload files: ' + error.message });
        }
    },

    downloadSFTPFile: async (req, res) => {
        const { path } = req.query;

        try {
            const fileBuffer = await downloadSFTPFile(path);
            const filename = path.split('/').pop();

            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            res.send(fileBuffer);
        } catch (error) {
            console.error('Error downloading file:', error);
            res.status(500).json({ error: 'Failed to download file' });
        }
    },

    downloadSFTPFiles: async (req, res) => {
        const { files } = req.body;

        if (!files?.length) return res.status(400).json({ error: 'No files specified for download' });

        const zip = new JSZip();

        try {
            for (const file of files) {
                const pathContents = await listSFTPFiles(file.path.split('/').slice(0, -1).join('/'));
                const fileInfo = pathContents.find(f => f.name === file.path.split('/').pop());

                if (fileInfo && fileInfo.type === 'd') {
                    const contents = await listSFTPFiles(file.path);
                    for (const item of contents) {
                        if (item.type !== 'd') {
                            const fileBuffer = await downloadSFTPFile(item.path);
                            zip.file(`${file.name}/${item.name}`, fileBuffer);
                        }
                    }
                } else {
                    const fileBuffer = await downloadSFTPFile(file.path);
                    zip.file(file.name, fileBuffer);
                }
            }

            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });

            res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipBuffer);

        } catch (error) {
            res.status(500).json({ error: 'Failed to process files' });
        }
    },
    archiveSFTPFile: async (req, res) => {
        const { path } = req.body;

        try {
            const fileBuffer = await downloadSFTPFile(path);
            const filename = path.split('/').pop();
            const directoryPath = path.split('/').slice(0, -1).join('/');
            const zip = new JSZip();

            zip.file(filename, fileBuffer);

            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });
            const archivePath = `${directoryPath}/${filename}.zip`;
            await uploadSFTPFile(zipBuffer, archivePath);

            res.json({
                success: true,
                message: 'File archived successfully',
                archivePath: archivePath
            });
        } catch (error) {
            console.error('Error archiving file:', error);
            res.status(500).json({ error: 'Failed to archive file' });
        }
    },

    archiveSFTPFiles: async (req, res) => {
        const { files } = req.body;

        if (!files?.length) return res.status(400).json({ error: 'No files specified for archive' });

        const zip = new JSZip();
        const currentDirectory = files[0].path.split('/').slice(0, -1).join('/');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `archive_${timestamp}.zip`;

        try {
            for (const file of files) {
                const pathContents = await listSFTPFiles(file.path.split('/').slice(0, -1).join('/'));
                const fileInfo = pathContents.find(f => f.name === file.path.split('/').pop());

                if (fileInfo && fileInfo.type === 'd') {
                    const folderContents = await listSFTPRecursive(file.path);
                    for (const item of folderContents) {
                        if (item.type !== 'd') {
                            const relativePath = item.path.replace(file.path, '').replace(/^\//, '');
                            const fileBuffer = await downloadSFTPFile(item.path);
                            zip.file(`${file.name}/${relativePath}`, fileBuffer);
                        }
                    }
                } else {
                    const fileBuffer = await downloadSFTPFile(file.path);
                    zip.file(file.name, fileBuffer);
                }
            }

            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE',
                comment: `Archived on ${new Date().toISOString()}`
            });

            const archivePath = `${currentDirectory}/${archiveName}`;
            await uploadSFTPFile(zipBuffer, archivePath);

            res.json({
                success: true,
                message: 'Files archived successfully',
                archivePath: archivePath
            });

        } catch (error) {
            console.error('Error archiving files:', error);
            res.status(500).json({ error: 'Failed to process files' });
        }
    },

    unarchiveSFTPFile: async (req, res) => {
        const { path } = req.body;
        try {
            await unarchiveFile(path);

            res.json({ message: 'File unarchived successfully' });
        } catch (error) {
            console.error('Error unarchiving file:', error);
            res.status(500).json({ error: 'Failed to unarchive file' });
        }
    },

    moveSFTPFile: async (req, res) => {
        const { sourcePath, targetPath } = req.body;
        try {
            await moveFileOrFolder(sourcePath, targetPath);
            res.json({ message: 'File(s) moved successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to move file(s)' });
        }
    },

    getDatabases: async (req, res) => {
        try {
            const databases = await listDatabases();

            const sanitizedDatabases = databases.map(db => ({
                ...db,
                tables: parseInt(db.tables.toString())
            }));

            res.json(sanitizedDatabases);
        } catch (error) {
            console.error('Failed to list databases:', error);
            res.status(500).json({error: 'Failed to fetch databases'});
        }
    },

    createDatabase: async (req, res) => {
        const {name} = req.body;
        try {
            await createDatabase(name);
            res.json({message: 'Database created successfully'});
        } catch (error) {
            console.error('Failed to create database:', error);
            res.status(500).json({error: 'Failed to create database'});
        }
    },

    deleteDatabase: async (req, res) => {
        const {name} = req.params;
        try {
            await deleteDatabase(name);
            res.json({message: 'Database deleted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to delete database'});
        }
    },

    resetDatabasePassword: async (req, res) => {
        const {name} = req.params;
        try {
            const {username, password} = await resetDatabasePassword(name);
            res.json({message: 'Database password reset successfully', username, password});
        } catch (error) {
            res.status(500).json({error: 'Failed to reset database password'});
        }
    },

    getNodes: async (req, res) => {
        try {
            const nodes = await kubernetesClient.listNodeNames();
            res.json(nodes);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch nodes' });
        }
    },

    getCPUMetrics: async (req, res) => {
        const {pod} = req.query;
        try {
            const data = await getPodCPUUsageForGraph(pod);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch CPU usage data' });
        }
    },

    getMemoryMetrics: async (req, res) => {
        const {pod} = req.query;
        try {
            const data = await getPodMemoryUsageForGraph(pod);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch memory usage data' });
        }
    }
};

export default api;

