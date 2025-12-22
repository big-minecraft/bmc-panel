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

export interface FileSpec {
    path: string;
    name: string;
}

export interface SessionListResponse {
    sessions: FileEditSession[];
}

export interface SessionStatusResponse {
    session: FileEditSession;
}

export interface ListFilesResponse {
    files: FileMetadata[];
    deploymentTypeIndex: number | null;
}

export interface FileContentResponse {
    content: string;
}

export interface UploadResponse {
    message: string;
}
