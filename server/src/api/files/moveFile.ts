import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface MoveFileRequest {
    sessionId: string;
    sourcePath: string;
    destinationPath: string;
}

interface MoveFileResponse {
    message: string;
}

export const moveFileEndpoint: ApiEndpoint<MoveFileRequest, MoveFileResponse> = {
    path: '/api/files/move',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                sourcePath: z.string().min(1),
                destinationPath: z.string().min(1),
            });

            const { sessionId, sourcePath, destinationPath } = schema.parse(req.body);

            await PVCFileOperationsService.getInstance().moveFile(sessionId, sourcePath, destinationPath);

            res.json({
                success: true,
                data: {
                    message: 'File moved successfully',
                },
            });
        } catch (error) {
            console.error('Failed to move file:', error);
            const message = error instanceof Error ? error.message : 'Failed to move file';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
