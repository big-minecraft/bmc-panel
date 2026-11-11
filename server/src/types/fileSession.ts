export interface FileEditSession {
    id: string;
    deploymentName: string;
    podName: string;
    pvcName: string;
    userId: string;
    createdAt: number;
    lastActivity: number;
    status: 'creating' | 'ready' | 'error' | 'terminating';
    namespace: string;
    authorizedKeyCount: number;
    sftpCredentials?: {
        host: string;
        port: number;
        username: string;
        password?: string;
        passwordAuth: boolean;
        authorizedKeyCount: number;
    };
}

export interface FileMetadata {
    name: string;
    type: 'd' | '-' | 'l';
    size: number;
    modifyTime: number;
    path: string;
    permissions: string;
    isText: boolean;
}

export interface FileOperationResult {
    success: boolean;
    data?: any;
    error?: string;
    stdout?: string;
    stderr?: string;
}

export interface ExecResult {
    /** Raw bytes, so that binary output survives the trip out of the pod. */
    stdout: Buffer;
    stderr: string;
    exitCode: number;
}

export interface FileSpec {
    path: string;
    name: string;
}

export interface UploadFile {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
}

export class FileOperationError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'FileOperationError';
    }
}

export enum FileOperationErrorCode {
    SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    SESSION_NOT_READY = 'SESSION_NOT_READY',
    POD_NOT_READY = 'POD_NOT_READY',
    POD_EXEC_FAILED = 'POD_EXEC_FAILED',
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    INVALID_PATH = 'INVALID_PATH',
    DEPLOYMENT_NOT_FOUND = 'DEPLOYMENT_NOT_FOUND',
    PVC_NOT_FOUND = 'PVC_NOT_FOUND',
    NO_SFTP_CREDENTIALS = 'NO_SFTP_CREDENTIALS',
}
