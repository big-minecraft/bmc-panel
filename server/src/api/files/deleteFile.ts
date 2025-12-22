import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface DeleteFileRequest {
    sessionId: string;
    path: string;
}

interface DeleteFileResponse {
    message: string;
}

export const deleteFileEndpoint: ApiEndpoint<DeleteFileRequest, DeleteFileResponse> = {
    path: '/api/files/delete-file',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
            });

            const { sessionId, path } = schema.parse(req.body);

            await PVCFileOperationsService.getInstance().deleteFile(sessionId, path);

            res.json({
                success: true,
                data: {
                    message: 'File deleted successfully',
                },
            });
        } catch (error) {
            console.error('Failed to delete file:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete file';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
