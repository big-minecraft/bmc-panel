import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface CreateDirectoryRequest {
    sessionId: string;
    path: string;
}

interface CreateDirectoryResponse {
    message: string;
}

export const createDirectoryEndpoint: ApiEndpoint<CreateDirectoryRequest, CreateDirectoryResponse> = {
    path: '/api/files/create-directory',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
            });

            console.log("a")

            const { sessionId, path } = schema.parse(req.body);
            await PVCFileOperationsService.getInstance().createDirectory(sessionId, path);

            console.log("b")

            res.json({
                success: true,
                data: {
                    message: 'Directory created successfully',
                },
            });
        } catch (error) {
            console.error('Failed to create directory:', error);
            const message = error instanceof Error ? error.message : 'Failed to create directory';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
