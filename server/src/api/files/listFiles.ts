import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import DeploymentManager from '../../features/deployments/controllers/deploymentManager';
import { FileMetadata } from '../../types/fileSession';

interface ListFilesResponse {
    files: FileMetadata[];
}

export const listFilesEndpoint: ApiEndpoint<unknown, ListFilesResponse> = {
    path: '/api/files/list',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const sessionId = req.query.sessionId as string;
            const path = req.query.path as string;

            console.log(`[listFiles API] sessionId: ${sessionId}, path: ${path}`);

            if (!sessionId || !path) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId and path query parameters are required',
                });
                return;
            }

            const files = await PVCFileOperationsService.getInstance().listFiles(sessionId, path);

            console.log(`[listFiles API] returning ${files.length} files`);

            res.json({
                success: true,
                data: {
                    files,
                },
            });
        } catch (error) {
            console.error('Failed to list files:', error);
            const message = error instanceof Error ? error.message : 'Failed to list files';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
