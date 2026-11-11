import { Response } from 'express';
import { ZodError } from 'zod';
import { FileOperationError, FileOperationErrorCode } from '../../types/fileSession';

const STATUS_BY_CODE: Record<string, number> = {
    [FileOperationErrorCode.SESSION_NOT_FOUND]: 404,
    [FileOperationErrorCode.SESSION_EXPIRED]: 410,
    [FileOperationErrorCode.SESSION_NOT_READY]: 409,
    [FileOperationErrorCode.POD_NOT_READY]: 409,
    [FileOperationErrorCode.FILE_NOT_FOUND]: 404,
    [FileOperationErrorCode.INVALID_PATH]: 400,
    [FileOperationErrorCode.PERMISSION_DENIED]: 403,
    [FileOperationErrorCode.POD_EXEC_FAILED]: 502,
};

export function sendFileError(res: Response, error: unknown, fallbackMessage: string): void {
    if (error instanceof ZodError) {
        res.status(400).json({ success: false, error: error.issues[0]?.message ?? 'Invalid request' });
        return;
    }

    if (error instanceof FileOperationError) {
        res.status(STATUS_BY_CODE[error.code] ?? 500).json({ success: false, error: error.message });
        return;
    }

    console.error(`${fallbackMessage}:`, error);
    res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : fallbackMessage,
    });
}

export function attachmentHeader(fileName: string): string {
    const ascii = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
