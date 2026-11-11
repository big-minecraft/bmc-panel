import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import DownloadTokenService from '../../services/downloadTokenService';
import { attachmentHeader, sendFileError } from './respond';

export const downloadFileEndpoint: ApiEndpoint<unknown, never> = {
    path: '/api/files/download',
    method: 'get',
    auth: AuthType.None,
    handler: async (req, res) => {
        const token = typeof req.query.token === 'string' ? req.query.token : '';
        const grant = await DownloadTokenService.consume(token);

        if (!grant) {
            res.status(403).json({ success: false, error: 'This download link has expired' });
            return;
        }

        const files = PVCFileOperationsService.getInstance();

        try {
            res.setHeader('Content-Disposition', attachmentHeader(grant.fileName));
            res.setHeader('Cache-Control', 'no-store');

            if (grant.archive) {
                res.setHeader('Content-Type', 'application/gzip');
                await files.streamArchive(grant.sessionId, grant.files, res);
            } else {
                res.setHeader('Content-Type', 'application/octet-stream');
                await files.streamFile(grant.sessionId, grant.files[0].path, res, (file) => {
                    res.setHeader('Content-Length', file.size);
                });
            }

            res.end();
        } catch (error) {
            if (res.headersSent || res.writableEnded) {
                console.error('Download failed after the response had started:', error);
                res.destroy();
                return;
            }

            res.removeHeader('Content-Disposition');
            res.removeHeader('Content-Length');
            sendFileError(res, error, 'Failed to download');
        }
    },
};
