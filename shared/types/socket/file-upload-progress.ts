export interface FileUploadProgress {
    sessionId: string;
    fileName: string;
    currentChunk: number;
    totalChunks: number;
    percentComplete: number;
}