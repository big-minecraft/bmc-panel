import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';

interface GetFileContentRequest {
    sessionId: string;
    path: string;
}

export const getFileContentEndpoint: ApiEndpoint<GetFileContentRequest, any> = {
    path: '/api/files/get-content',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const sessionId = req.body.sessionId as string;
            const path = req.body.path as string;

            console. log(path);
            if (!sessionId || !path) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId and path are required',
                });
                return;
            }

            const content = await PVCFileOperationsService.getInstance().readFile(sessionId, path);

            // Try to detect if it's text and send as string, otherwise send as binary
            const contentStr = content.toString('utf8');
            const isBinary = contentStr.includes('\x00');

            if (isBinary) {
                res.setHeader('Content-Type', 'application/octet-stream');
                res.send(content);
            } else {
                res.json({
                    success: true,
                    data: {
                        content: contentStr,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to get file content:', error);
            const message = error instanceof Error ? error.message : 'Failed to get file content';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
