import * as path from 'path';
import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService, { validateUploadName } from '../../services/pvcFileOperationsService';
import ConfigManager from '../../features/config/controllers/configManager';
import { sendFileError } from './respond';
import { FileOperationError, FileOperationErrorCode } from '../../types/fileSession';

interface UploadFileResponse {
    path: string;
    size: number;
}

export const uploadFilesEndpoint: ApiEndpoint<unknown, UploadFileResponse> = {
    path: '/api/files/upload',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
                name: z.string().min(1),
            });

            const { sessionId, path: directory, name } = schema.parse(req.query);
            const relativeName = validateUploadName(name);
            const size = Number(req.headers['content-length']);

            if (!Number.isInteger(size) || size < 0) {
                throw new FileOperationError(
                    'A Content-Length header is required to upload a file',
                    FileOperationErrorCode.INVALID_PATH
                );
            }

            const maxBytes = maxUploadBytes();
            if (size > maxBytes) {
                res.status(413).json({
                    success: false,
                    error: `${name} is larger than the ${Math.round(maxBytes / 1024 / 1024)} MB upload limit`,
                });
                return;
            }

            const target = path.posix.join(directory, relativeName);
            await PVCFileOperationsService.getInstance().writeFileStream(sessionId, target, req, size);

            res.json({ success: true, data: { path: target, size } });
        } catch (error) {
            sendFileError(res, error, 'Failed to upload file');
        }
    },
};

function maxUploadBytes(): number {
    const configured = ConfigManager.getConfig().fileEditSession?.maxUploadMb;
    return configured * 1024 * 1024;
}
