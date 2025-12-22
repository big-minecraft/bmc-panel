import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface UpdateFileRequest {
    sessionId: string;
    path: string;
    content: string;
}

interface UpdateFileResponse {
    message: string;
}

export const updateFileEndpoint: ApiEndpoint<UpdateFileRequest, UpdateFileResponse> = {
    path: '/api/files/update',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
                content: z.string(),
            });

            const { sessionId, path, content } = schema.parse(req.body);

            await PVCFileOperationsService.getInstance().writeFile(sessionId, path, content);

            res.json({
                success: true,
                data: {
                    message: 'File updated successfully',
                },
            });
        } catch (error) {
            console.error('Failed to update file:', error);
            const message = error instanceof Error ? error.message : 'Failed to update file';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
