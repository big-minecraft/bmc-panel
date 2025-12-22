import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface ArchiveFileRequest {
    sessionId: string;
    path: string;
}

interface ArchiveFileResponse {
    message: string;
    archivePath: string;
}

export const archiveFileEndpoint: ApiEndpoint<ArchiveFileRequest, ArchiveFileResponse> = {
    path: '/api/files/archive',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
            });

            const { sessionId, path } = schema.parse(req.body);

            const archivePath = await PVCFileOperationsService.getInstance().archiveFile(sessionId, path);

            res.json({
                success: true,
                data: {
                    message: 'File archived successfully',
                    archivePath,
                },
            });
        } catch (error) {
            console.error('Failed to archive file:', error);
            const message = error instanceof Error ? error.message : 'Failed to archive file';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
