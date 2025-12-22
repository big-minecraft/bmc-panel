import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import * as path from 'path';

interface DownloadFileRequest {
    sessionId: string;
    path: string;
}

export const downloadFileEndpoint: ApiEndpoint<DownloadFileRequest, any> = {
    path: '/api/files/download',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const sessionId = req.body.sessionId;
            const filePath = req.body.path;

            if (!sessionId || !filePath) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId and path are required',
                });
                return;
            }

            const content = await PVCFileOperationsService.getInstance().downloadFile(sessionId, filePath);

            const filename = path.basename(filePath);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(content);
        } catch (error) {
            console.error('Failed to download file:', error);
            const message = error instanceof Error ? error.message : 'Failed to download file';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
