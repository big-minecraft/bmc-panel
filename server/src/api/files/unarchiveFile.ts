import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface UnarchiveFileRequest {
    sessionId: string;
    archivePath: string;
}

interface UnarchiveFileResponse {
    message: string;
}

export const unarchiveFileEndpoint: ApiEndpoint<UnarchiveFileRequest, UnarchiveFileResponse> = {
    path: '/api/files/unarchive',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                archivePath: z.string().min(1),
            });

            const { sessionId, archivePath } = schema.parse(req.body);

            await PVCFileOperationsService.getInstance().unarchiveFile(sessionId, archivePath);

            res.json({
                success: true,
                data: {
                    message: 'File unarchived successfully',
                },
            });
        } catch (error) {
            console.error('Failed to unarchive file:', error);
            const message = error instanceof Error ? error.message : 'Failed to unarchive file';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
