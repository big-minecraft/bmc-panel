import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface ArchiveMultipleRequest {
    sessionId: string;
    files: Array<{ path: string; name: string }>;
    archiveName?: string;
}

interface ArchiveMultipleResponse {
    message: string;
    archivePath: string;
}

export const archiveMultipleEndpoint: ApiEndpoint<ArchiveMultipleRequest, ArchiveMultipleResponse> = {
    path: '/api/files/archive-multiple',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                files: z.array(z.object({
                    path: z.string().min(1),
                    name: z.string().min(1),
                })).min(1),
                archiveName: z.string().optional(),
            });

            const validatedData = schema.parse(req.body);
            const { sessionId, files, archiveName } = validatedData;

            const archivePath = await PVCFileOperationsService.getInstance().archiveMultiple(
                sessionId,
                files as Array<{ path: string; name: string }>,
                archiveName
            );

            res.json({
                success: true,
                data: {
                    message: 'Files archived successfully',
                    archivePath,
                },
            });
        } catch (error) {
            console.error('Failed to archive files:', error);
            const message = error instanceof Error ? error.message : 'Failed to archive files';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};