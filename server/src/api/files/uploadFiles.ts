import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import multer from 'multer';

interface UploadFilesResponse {
    message: string;
}

const upload = multer({ storage: multer.memoryStorage() });

interface UploadFilesRequest {
    sessionId: string;
    path: string;
}

export const uploadFilesEndpoint: ApiEndpoint<UploadFilesRequest, UploadFilesResponse> = {
    path: '/api/files/upload',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            // Apply multer middleware manually
            await new Promise<void>((resolve, reject) => {
                upload.array('files')(req as any, res as any, (err: any) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            const sessionId = req.body.sessionId as string;
            const path = req.body.path as string;
            const files = (req as any).files as Express.Multer.File[];

            if (!sessionId || !path) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId and path are required',
                });
                return;
            }

            if (!files || files.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'No files uploaded',
                });
                return;
            }

            await PVCFileOperationsService.getInstance().uploadFiles(sessionId, files, path);

            res.json({
                success: true,
                data: {
                    message: 'Files uploaded successfully',
                },
            });
        } catch (error) {
            console.error('Failed to upload files:', error);
            const message = error instanceof Error ? error.message : 'Failed to upload files';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
