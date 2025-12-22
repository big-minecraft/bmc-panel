import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import { FileSpec } from '../../types/fileSession';

interface DownloadMultipleRequest {
    sessionId: string;
    files: FileSpec[];
}

export const downloadMultipleEndpoint: ApiEndpoint<DownloadMultipleRequest, any> = {
    path: '/api/files/download-multiple',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                files: z.array(z.object({
                    path: z.string().min(1),
                    name: z.string().min(1),
                })),
            });

            const parsed = schema.parse(req.body);
            const sessionId = parsed.sessionId;
            const files = parsed.files as FileSpec[];

            const zipBuffer = await PVCFileOperationsService.getInstance().downloadMultiple(sessionId, files);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `files-${timestamp}.zip`;

            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipBuffer);
        } catch (error) {
            console.error('Failed to download multiple files:', error);
            const message = error instanceof Error ? error.message : 'Failed to download multiple files';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
