import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface CreateFileRequest {
    sessionId: string;
    path: string;
    content: string;
}

interface CreateFileResponse {
    message: string;
}

export const createFileEndpoint: ApiEndpoint<CreateFileRequest, CreateFileResponse> = {
    path: '/api/files/create',
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
                    message: 'File created successfully',
                },
            });
        } catch (error) {
            console.error('Failed to create file:', error);
            const message = error instanceof Error ? error.message : 'Failed to create file';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
