import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface DeleteDirectoryRequest {
    sessionId: string;
    path: string;
}

interface DeleteDirectoryResponse {
    message: string;
}

export const deleteDirectoryEndpoint: ApiEndpoint<DeleteDirectoryRequest, DeleteDirectoryResponse> = {
    path: '/api/files/delete-directory',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
            });

            const { sessionId, path } = schema.parse(req.body);

            await PVCFileOperationsService.getInstance().deleteDirectory(sessionId, path);

            res.json({
                success: true,
                data: {
                    message: 'Directory deleted successfully',
                },
            });
        } catch (error) {
            console.error('Failed to delete directory:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete directory';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
