import * as K8s from '@kubernetes/client-node';
import { Writable } from 'stream';
import { FileMetadata, ExecResult, FileOperationError, FileOperationErrorCode, FileSpec, UploadFile } from '../types/fileSession';
import KubernetesService from './kubernetesService';
import FileSessionService from './fileSessionService';
import { Enum } from '../../../shared/enum/enum';
import { FileUploadProgress } from '../../../shared/types/socket/file-upload-progress';
import JSZip from 'jszip';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export default class PVCFileOperationsService {
    private static instance: PVCFileOperationsService;
    private exec: K8s.Exec;
    private socketManager: any = null;

    private constructor() {
        const k8s = KubernetesService.getInstance();
        this.exec = new K8s.Exec(k8s.kc);
        console.log('PVCFileOperationsService initialized');
    }

    public static getInstance(): PVCFileOperationsService {
        return PVCFileOperationsService.instance;
    }

    public static init(): void {
        PVCFileOperationsService.instance = new PVCFileOperationsService();
    }

    public setSocketManager(socketManager: any): void {
        this.socketManager = socketManager;
        console.log('SocketManager set for PVCFileOperationsService');
    }

    // Basic file operations

    public async listFiles(sessionId: string, dirPath: string): Promise<FileMetadata[]> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            // Use find + stat for BusyBox compatibility
            // Format: name|size|mtime|type|permissions
            const command = [
                'sh', '-c',
                `find "${dirPath}" -maxdepth 1 -mindepth 1 -exec stat -c '%n|%s|%Y|%F|%a' {} \\;`
            ];
            console.log(`[listFiles] sessionId: ${sessionId}, dirPath: ${dirPath}`);
            const result = await this.execInPod(session.podName, session.namespace, command);
            console.log(`[listFiles] exitCode: ${result.exitCode}, stdout length: ${result.stdout.length}`);

            if (result.exitCode !== 0) {
                if (result.stderr.includes('No such file or directory')) {
                    throw new FileOperationError(
                        `Directory ${dirPath} not found`,
                        FileOperationErrorCode.FILE_NOT_FOUND
                    );
                }
                throw new Error(`Failed to list files: ${result.stderr}`);
            }

            const lines = result.stdout.trim().split('\n').filter(line => line.length > 0);
            console.log(`[listFiles] parsed ${lines.length} lines from output`);
            const files: FileMetadata[] = [];

            for (const line of lines) {
                // Parse: /path/to/file|1234|1703073836|regular file|644
                const parts = line.split('|');
                if (parts.length < 5) continue;

                const fullPath = parts[0];
                const size = parseInt(parts[1]);
                const modifyTime = parseInt(parts[2]) * 1000; // Convert to ms
                const fileType = parts[3];
                const permissions = parts[4];

                // Extract just the filename from the full path
                const name = fullPath.split('/').pop() || '';

                // Determine type: d = directory, l = symlink, - = regular file
                let type: 'd' | 'l' | '-' = '-';
                if (fileType.includes('directory')) {
                    type = 'd';
                } else if (fileType.includes('symbolic link')) {
                    type = 'l';
                }

                // Format permissions as ls -l style (e.g., drwxr-xr-x)
                const typeChar = type === 'd' ? 'd' : type === 'l' ? 'l' : '-';
                const permStr = this.formatPermissions(permissions);
                const formattedPerms = `${typeChar}${permStr}`;

                // Check if file is text (only for files under 100KB)
                let isText = false;
                if (type === '-' && size < 1024 * 100 && size > 0) {
                    isText = await this.isTextFile(session.podName, session.namespace, fullPath);
                } else if (size === 0) {
                    isText = true;
                }

                files.push({
                    name,
                    type,
                    size,
                    modifyTime,
                    path: fullPath,
                    permissions: formattedPerms,
                    isText,
                });
            }

            console.log(`[listFiles] returning ${files.length} files`);
            return files;
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }

    private formatPermissions(octal: string): string {
        // Convert octal (e.g., "755") to rwxr-xr-x format
        const perms = parseInt(octal, 8);
        const chars = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];

        const user = chars[(perms >> 6) & 7];
        const group = chars[(perms >> 3) & 7];
        const other = chars[perms & 7];

        return user + group + other;
    }

    public async readFile(sessionId: string, filePath: string): Promise<Buffer> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            // Use base64 encoding to safely transfer binary files through stdout
            const command = ['sh', '-c', `base64 "${filePath}"`];
            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                if (result.stderr.includes('No such file or directory')) {
                    throw new FileOperationError(
                        `File ${filePath} not found`,
                        FileOperationErrorCode.FILE_NOT_FOUND
                    );
                }
                throw new Error(`Failed to read file: ${result.stderr}`);
            }

            // Decode base64 to get the original binary content
            return Buffer.from(result.stdout.trim(), 'base64');
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    public async writeFile(sessionId: string, filePath: string, content: Buffer | string): Promise<void> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            // Ensure parent directory exists
            const dirPath = path.dirname(filePath);
            await this.createDirectory(sessionId, dirPath);

            // Convert content to buffer
            const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');

            // Use chunked approach to avoid memory limits and URL length limits
            // Convert to base64 in chunks to avoid "string too long" error
            const tempFile = `/tmp/upload-${Date.now()}-${Math.random().toString(36).substring(7)}.b64`;

            // Process in chunks of raw bytes (before base64 encoding)
            // Base64 encoding increases size by ~33%, so we use smaller raw chunks
            const rawChunkSize = 30000; // Raw bytes per chunk (will become ~40KB base64)
            const totalChunks = Math.ceil(buffer.length / rawChunkSize);

            try {
                // Clear/create the temp file
                await this.execInPod(session.podName, session.namespace, ['sh', '-c', `> "${tempFile}"`]);

                // Write content in chunks, converting each chunk to base64 separately
                for (let i = 0; i < buffer.length; i += rawChunkSize) {
                    const rawChunk = buffer.subarray(i, Math.min(i + rawChunkSize, buffer.length));
                    const base64Chunk = rawChunk.toString('base64');

                    // Escape single quotes in chunk for printf
                    const escapedChunk = base64Chunk.replace(/'/g, "'\\''");

                    // Use printf to append chunk (more reliable than echo for binary data)
                    const appendCommand = ['sh', '-c', `printf '%s' '${escapedChunk}' >> "${tempFile}"`];
                    const appendResult = await this.execInPod(session.podName, session.namespace, appendCommand);

                    if (appendResult.exitCode !== 0) {
                        throw new FileOperationError(
                            `Failed to write chunk to temp file: ${appendResult.stderr}`,
                            FileOperationErrorCode.POD_EXEC_FAILED
                        );
                    }

                    const chunkNum = Math.floor(i / rawChunkSize) + 1;
                    const percentComplete = Math.round((i / buffer.length) * 100);
                    console.log(`Written chunk ${chunkNum}/${totalChunks} (${percentComplete}%)`);

                    // Emit progress via WebSocket
                    if (this.socketManager) {
                        const progressData: FileUploadProgress = {
                            sessionId,
                            fileName: path.basename(filePath),
                            currentChunk: chunkNum,
                            totalChunks,
                            percentComplete
                        };
                        this.socketManager.sendAll(Enum.SocketMessageType.FILE_UPLOAD_PROGRESS, progressData);
                    }
                }

                // Decode from temp file to target file
                const decodeCommand = ['sh', '-c', `base64 -d < "${tempFile}" > "${filePath}"`];
                const decodeResult = await this.execInPod(session.podName, session.namespace, decodeCommand);

                if (decodeResult.exitCode !== 0) {
                    throw new FileOperationError(
                        `Failed to decode and write file ${filePath}: ${decodeResult.stderr}`,
                        FileOperationErrorCode.POD_EXEC_FAILED
                    );
                }

                console.log(`File write completed: ${filePath} (${buffer.length} bytes)`);
            } finally {
                // Clean up temp file
                await this.execInPod(session.podName, session.namespace, ['rm', '-f', tempFile]);
            }

            await this.refreshSessionActivity(sessionId);
        } catch (error) {
            console.error('Error writing file:', error);
            throw error;
        }
    }

    public async deleteFile(sessionId: string, filePath: string): Promise<void> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            const command = ['rm', '-f', filePath];
            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                throw new FileOperationError(
                    `Failed to delete file ${filePath}: ${result.stderr}`,
                    FileOperationErrorCode.POD_EXEC_FAILED
                );
            }

            await this.refreshSessionActivity(sessionId);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    // Directory operations

    public async createDirectory(sessionId: string, dirPath: string): Promise<void> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            const command = ['mkdir', '-p', dirPath];
            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                throw new FileOperationError(
                    `Failed to create directory ${dirPath}: ${result.stderr}`,
                    FileOperationErrorCode.POD_EXEC_FAILED
                );
            }

            await this.refreshSessionActivity(sessionId);
        } catch (error) {
            console.error('Error creating directory:', error);
            throw error;
        }
    }

    public async deleteDirectory(sessionId: string, dirPath: string): Promise<void> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            const command = ['rm', '-rf', dirPath];
            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                throw new FileOperationError(
                    `Failed to delete directory ${dirPath}: ${result.stderr}`,
                    FileOperationErrorCode.POD_EXEC_FAILED
                );
            }

            await this.refreshSessionActivity(sessionId);
        } catch (error) {
            console.error('Error deleting directory:', error);
            throw error;
        }
    }

    // Advanced operations

    public async moveFile(sessionId: string, sourcePath: string, destinationPath: string): Promise<void> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            // Ensure destination directory exists
            const destDir = path.dirname(destinationPath);
            await this.createDirectory(sessionId, destDir);

            const command = ['mv', sourcePath, destinationPath];
            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                throw new FileOperationError(
                    `Failed to move ${sourcePath} to ${destinationPath}: ${result.stderr}`,
                    FileOperationErrorCode.POD_EXEC_FAILED
                );
            }

            await this.refreshSessionActivity(sessionId);
        } catch (error) {
            console.error('Error moving file:', error);
            throw error;
        }
    }

    public async statFile(sessionId: string, filePath: string): Promise<FileMetadata> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            // Get file stats: size, modify time, type
            const command = ['stat', '-c', '%s %Y %A %F', filePath];
            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                throw new FileOperationError(
                    `File ${filePath} not found`,
                    FileOperationErrorCode.FILE_NOT_FOUND
                );
            }

            const parts = result.stdout.trim().split(' ');
            const size = parseInt(parts[0]);
            const modifyTime = parseInt(parts[1]) * 1000;
            const permissions = parts[2];
            const fileType = parts.slice(3).join(' ');

            let type: 'd' | '-' | 'l' = '-';
            if (fileType.includes('directory')) {
                type = 'd';
            } else if (fileType.includes('symbolic link')) {
                type = 'l';
            }

            const name = path.basename(filePath);
            const isText = type === '-' && size < 1024 * 100 && size > 0
                ? await this.isTextFile(session.podName, session.namespace, filePath)
                : size === 0;

            return {
                name,
                type,
                size,
                modifyTime,
                path: filePath,
                permissions,
                isText,
            };
        } catch (error) {
            console.error('Error getting file stats:', error);
            throw error;
        }
    }

    public async listRecursive(sessionId: string, dirPath: string): Promise<FileMetadata[]> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            const command = ['find', dirPath, '-type', 'f', '-exec', 'ls', '-l', '{}', ';'];
            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                throw new FileOperationError(
                    `Failed to list directory recursively: ${result.stderr}`,
                    FileOperationErrorCode.POD_EXEC_FAILED
                );
            }

            const lines = result.stdout.trim().split('\n').filter(line => line.length > 0);
            const files: FileMetadata[] = [];

            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length < 9) continue;

                const permissions = parts[0];
                const size = parseInt(parts[4]);
                const name = path.basename(parts[8]);
                const fullPath = parts[8];

                files.push({
                    name,
                    type: '-',
                    size,
                    modifyTime: Date.now(),
                    path: fullPath,
                    permissions,
                    isText: false,
                });
            }

            return files;
        } catch (error) {
            console.error('Error listing files recursively:', error);
            throw error;
        }
    }

    // Archive operations

    public async archiveFile(sessionId: string, filePath: string): Promise<string> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            const dirPath = path.dirname(filePath);
            const fileName = path.basename(filePath);
            const archiveName = `${fileName}.tar.gz`;
            const archivePath = path.join(dirPath, archiveName);

            const command = ['sh', '-c', `cd ${dirPath} && tar -czf ${archiveName} ${fileName}`];
            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                throw new FileOperationError(
                    `Failed to archive ${filePath}: ${result.stderr}`,
                    FileOperationErrorCode.POD_EXEC_FAILED
                );
            }

            await this.refreshSessionActivity(sessionId);

            return archivePath;
        } catch (error) {
            console.error('Error archiving file:', error);
            throw error;
        }
    }

    public async archiveMultiple(
        sessionId: string,
        files: Array<{ path: string; name: string }>,
        archiveName?: string
    ): Promise<string> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            if (files.length === 0) {
                throw new FileOperationError(
                    'No files provided for archiving',
                    FileOperationErrorCode.INVALID_PATH
                );
            }

            // Determine the common parent directory
            const firstFilePath = files[0].path;
            const commonDir = path.dirname(firstFilePath);

            // Generate archive name
            const finalArchiveName = archiveName || `archive-${Date.now()}.tar.gz`;
            const archivePath = path.join(commonDir, finalArchiveName).replace(/\\/g, '/');

            // Build the tar command with all file names
            const fileNames = files.map(f => `"${path.basename(f.path)}"`).join(' ');
            const command = ['sh', '-c', `cd "${commonDir}" && tar -czf "${finalArchiveName}" ${fileNames}`];

            const result = await this.execInPod(session.podName, session.namespace, command);

            if (result.exitCode !== 0) {
                throw new FileOperationError(
                    `Failed to create archive: ${result.stderr}`,
                    FileOperationErrorCode.POD_EXEC_FAILED
                );
            }

            await this.refreshSessionActivity(sessionId);

            return archivePath;
        } catch (error) {
            console.error('Error creating archive:', error);
            throw error;
        }
    }

    public async unarchiveFile(sessionId: string, archivePath: string): Promise<void> {
        const session = await this.validateAndGetSession(sessionId);

        try {
            // Download the archive, extract locally, then upload extracted files back
            const archiveBuffer = await this.readFile(sessionId, archivePath);
            const extractDir = path.dirname(archivePath);

            // Create temp directory
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pvc-extract-'));
            const tempFile = path.join(tempDir, path.basename(archivePath));

            try {
                // Write archive to temp
                await fs.writeFile(tempFile, archiveBuffer);

                if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz') || archivePath.endsWith('.tar')) {
                    // Extract tar archive locally using child_process
                    const { exec } = require('child_process');
                    const { promisify } = require('util');
                    const execAsync = promisify(exec);

                    const tarCommand = archivePath.endsWith('.tar')
                        ? `tar -xf "${tempFile}" -C "${tempDir}"`
                        : `tar -xzf "${tempFile}" -C "${tempDir}"`;

                    try {
                        await execAsync(tarCommand);
                    } catch (error) {
                        throw new Error(`Tar extraction failed: ${error.message}`);
                    }

                    // Upload extracted files back to pod
                    await this.uploadExtractedFiles(sessionId, tempDir, extractDir, path.basename(archivePath));

                } else if (archivePath.endsWith('.zip')) {
                    // Use JSZip for ZIP files
                    const zip = new JSZip();
                    const contents = await zip.loadAsync(archiveBuffer);

                    for (const filename of Object.keys(contents.files)) {
                        const file = contents.files[filename];
                        if (!file.dir) {
                            const content = await file.async('nodebuffer');
                            const targetPath = path.join(extractDir, filename).replace(/\\/g, '/');
                            await this.writeFile(sessionId, targetPath, content);
                        }
                    }
                } else {
                    throw new FileOperationError(
                        `Unsupported archive format: ${archivePath}`,
                        FileOperationErrorCode.INVALID_PATH
                    );
                }

                await this.refreshSessionActivity(sessionId);
            } finally {
                // Cleanup temp directory
                await fs.rm(tempDir, { recursive: true, force: true });
            }
        } catch (error) {
            console.error('Error unarchiving file:', error);
            throw error;
        }
    }

    private async uploadExtractedFiles(
        sessionId: string,
        localDir: string,
        remoteDirPath: string,
        archiveName: string
    ): Promise<void> {
        const entries = await fs.readdir(localDir, { withFileTypes: true });

        for (const entry of entries) {
            // Skip the archive file itself
            if (entry.name === archiveName) {
                continue;
            }

            const localPath = path.join(localDir, entry.name);
            const remotePath = path.join(remoteDirPath, entry.name).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                // Recursively upload directory contents
                await this.uploadExtractedFiles(sessionId, localPath, remotePath, archiveName);
            } else if (entry.isFile()) {
                // Upload file
                const fileContent = await fs.readFile(localPath);
                await this.writeFile(sessionId, remotePath, fileContent);
            }
        }
    }

    // Upload/Download operations

    public async uploadFiles(sessionId: string, files: UploadFile[], basePath: string): Promise<void> {
        for (const file of files) {
            const targetPath = path.join(basePath, file.originalname).replace(/\\/g, '/');
            await this.writeFile(sessionId, targetPath, file.buffer);
        }

        await this.refreshSessionActivity(sessionId);
    }

    public async downloadFile(sessionId: string, filePath: string): Promise<Buffer> {
        await this.refreshSessionActivity(sessionId);
        return await this.readFile(sessionId, filePath);
    }

    public async downloadMultiple(sessionId: string, files: FileSpec[]): Promise<Buffer> {
        const zip = new JSZip();

        for (const file of files) {
            try {
                const content = await this.readFile(sessionId, file.path);
                zip.file(file.name, content);
            } catch (error) {
                console.error(`Error adding file ${file.path} to archive:`, error);
            }
        }

        await this.refreshSessionActivity(sessionId);
        return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    }

    // Private helper methods

    private async execInPod(
        podName: string,
        namespace: string,
        command: string[]
    ): Promise<ExecResult> {
        return new Promise((resolve, reject) => {
            const stdout: string[] = [];
            const stderr: string[] = [];
            let exitCode = 0;
            let isResolved = false;

            const stdoutStream = new Writable({
                write(chunk, encoding, callback) {
                    stdout.push(chunk.toString());
                    callback();
                }
            });

            const stderrStream = new Writable({
                write(chunk, encoding, callback) {
                    stderr.push(chunk.toString());
                    callback();
                }
            });

            // Add error handlers for streams
            stdoutStream.on('error', (err) => {
                if (!isResolved) {
                    isResolved = true;
                    console.error('stdout stream error:', err);
                    reject(err);
                }
            });

            stderrStream.on('error', (err) => {
                if (!isResolved) {
                    isResolved = true;
                    console.error('stderr stream error:', err);
                    reject(err);
                }
            });

            try {
                const execInstance = this.exec.exec(
                    namespace,
                    podName,
                    'file-editor',
                    command,
                    stdoutStream,
                    stderrStream,
                    null,
                    false,
                    (status) => {
                        if (!isResolved) {
                            isResolved = true;
                            if (status.status === 'Failure' || (status.code && status.code !== 0)) {
                                exitCode = status.code || 1;
                            }

                            resolve({
                                stdout: stdout.join(''),
                                stderr: stderr.join(''),
                                exitCode,
                            });
                        }
                    }
                );

                // Handle WebSocket connection errors (exec returns a Promise<WebSocket>)
                execInstance.then((ws) => {
                    ws.on('error', (err: Error) => {
                        if (!isResolved) {
                            isResolved = true;
                            console.error('exec websocket error:', err);
                            reject(err);
                        }
                    });
                }).catch((err) => {
                    if (!isResolved) {
                        isResolved = true;
                        console.error('exec connection failed:', err);
                        reject(err);
                    }
                });
            } catch (err) {
                if (!isResolved) {
                    isResolved = true;
                    console.error('exec call error:', err);
                    reject(err);
                }
            }
        });
    }

    private async execInPodWithStdin(
        podName: string,
        namespace: string,
        command: string[],
        stdinContent: string
    ): Promise<ExecResult> {
        return new Promise((resolve, reject) => {
            const stdout: string[] = [];
            const stderr: string[] = [];
            let exitCode = 0;
            let isResolved = false;

            const stdoutStream = new Writable({
                write(chunk, encoding, callback) {
                    stdout.push(chunk.toString());
                    callback();
                }
            });

            const stderrStream = new Writable({
                write(chunk, encoding, callback) {
                    stderr.push(chunk.toString());
                    callback();
                }
            });

            // Use PassThrough stream for stdin so we can control when data is written
            const { PassThrough } = require('stream');
            const stdinStream = new PassThrough();

            // Add error handlers for streams
            stdoutStream.on('error', (err) => {
                if (!isResolved) {
                    isResolved = true;
                    console.error('stdout stream error:', err);
                    reject(err);
                }
            });

            stderrStream.on('error', (err) => {
                if (!isResolved) {
                    isResolved = true;
                    console.error('stderr stream error:', err);
                    reject(err);
                }
            });

            stdinStream.on('error', (err) => {
                if (!isResolved) {
                    isResolved = true;
                    console.error('stdin stream error:', err);
                    reject(err);
                }
            });

            try {
                const execInstance = this.exec.exec(
                    namespace,
                    podName,
                    'file-editor',
                    command,
                    stdoutStream,
                    stderrStream,
                    stdinStream,
                    true, // Enable stdin
                    (status) => {
                        if (!isResolved) {
                            isResolved = true;
                            if (status.status === 'Failure' || (status.code && status.code !== 0)) {
                                exitCode = status.code || 1;
                            }

                            resolve({
                                stdout: stdout.join(''),
                                stderr: stderr.join(''),
                                exitCode,
                            });
                        }
                    }
                );

                // Handle WebSocket connection and write stdin data after connection is established
                execInstance.then((ws) => {
                    ws.on('error', (err: Error) => {
                        if (!isResolved) {
                            isResolved = true;
                            console.error('exec websocket error:', err);
                            stdinStream.end();
                            reject(err);
                        }
                    });

                    // Write data to stdin after connection is established
                    // Split into chunks to handle backpressure properly
                    const chunkSize = 64 * 1024; // 64KB chunks
                    let offset = 0;

                    const writeNextChunk = () => {
                        if (offset >= stdinContent.length) {
                            // All data written, end the stream
                            stdinStream.end();
                            console.log('Stdin write completed, total bytes:', stdinContent.length);
                            return;
                        }

                        const chunk = stdinContent.slice(offset, offset + chunkSize);
                        const canContinue = stdinStream.write(chunk);
                        offset += chunk.length;

                        if (canContinue) {
                            // Can write more immediately
                            setImmediate(writeNextChunk);
                        } else {
                            // Wait for drain event before writing more
                            stdinStream.once('drain', writeNextChunk);
                        }
                    };

                    // Start writing after a small delay to ensure connection is ready
                    setImmediate(writeNextChunk);

                }).catch((err) => {
                    if (!isResolved) {
                        isResolved = true;
                        console.error('exec connection failed:', err);
                        stdinStream.end();
                        reject(err);
                    }
                });
            } catch (err) {
                if (!isResolved) {
                    isResolved = true;
                    console.error('exec call error:', err);
                    stdinStream.end();
                    reject(err);
                }
            }
        });
    }

    private async isTextFile(podName: string, namespace: string, filePath: string): Promise<boolean> {
        try {
            // First, try to determine by file extension as a fallback
            const ext = path.extname(filePath).toLowerCase();
            const textExtensions = [
                '.txt', '.md', '.json', '.xml', '.yml', '.yaml', '.toml', '.ini', '.conf', '.config',
                '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
                '.go', '.rs', '.rb', '.php', '.html', '.css', '.scss', '.sass', '.less',
                '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
                '.sql', '.env', '.gitignore', '.dockerignore', '.editorconfig',
                '.log', '.csv', '.properties', '.gradle', '.maven'
            ];

            const isTextExtension = textExtensions.includes(ext);

            // Try MIME type detection
            const command = ['file', '--mime-type', '-b', filePath];
            const result = await this.execInPod(podName, namespace, command);

            if (result.exitCode === 0) {
                const mimeType = result.stdout.trim().toLowerCase();
                const isTextMime = mimeType.startsWith('text/') ||
                       mimeType.includes('json') ||
                       mimeType.includes('xml') ||
                       mimeType.includes('javascript') ||
                       mimeType.includes('yaml') ||
                       mimeType.includes('toml') ||
                       mimeType.includes('x-sh') ||
                       mimeType.includes('x-shellscript') ||
                       mimeType.includes('x-python') ||
                       mimeType.includes('x-java') ||
                       mimeType.includes('x-c') ||
                       mimeType.includes('x-c++') ||
                       // Also allow empty files and unknown text-like types
                       mimeType.includes('inode/x-empty') ||
                       mimeType.includes('application/octet-stream');

                // If MIME says it's text, trust it. Otherwise fall back to extension check
                return isTextMime || isTextExtension;
            }

            // If file command failed, fall back to extension check
            return isTextExtension;
        } catch (error) {
            // On error, try to determine by extension
            const ext = path.extname(filePath).toLowerCase();
            const textExtensions = [
                '.txt', '.md', '.json', '.xml', '.yml', '.yaml', '.toml', '.ini', '.conf', '.config',
                '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
                '.go', '.rs', '.rb', '.php', '.html', '.css', '.scss', '.sass', '.less',
                '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
                '.sql', '.env', '.gitignore', '.dockerignore', '.editorconfig',
                '.log', '.csv', '.properties', '.gradle', '.maven'
            ];
            return textExtensions.includes(ext);
        }
    }

    private async validateAndGetSession(sessionId: string) {
        const sessionService = FileSessionService.getInstance();
        const session = await sessionService.getSession(sessionId);

        if (!session) {
            throw new FileOperationError(
                `Session ${sessionId} not found`,
                FileOperationErrorCode.SESSION_NOT_FOUND
            );
        }

        if (session.status !== 'ready') {
            throw new FileOperationError(
                `Session ${sessionId} is not ready (status: ${session.status})`,
                FileOperationErrorCode.SESSION_NOT_READY
            );
        }

        const isValid = await sessionService.validateSession(sessionId);
        if (!isValid) {
            throw new FileOperationError(
                `Session ${sessionId} is not valid or pod is not ready`,
                FileOperationErrorCode.SESSION_EXPIRED
            );
        }

        return session;
    }

    private async refreshSessionActivity(sessionId: string): Promise<void> {
        try {
            await FileSessionService.getInstance().refreshActivity(sessionId);
        } catch (error) {
            console.error('Error refreshing session activity:', error);
        }
    }
}
