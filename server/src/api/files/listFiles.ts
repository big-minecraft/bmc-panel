import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import { FileMetadata } from '../../types/fileSession';
import { sendFileError } from './respond';

interface ListFilesResponse {
    files: FileMetadata[];
}

export const listFilesEndpoint: ApiEndpoint<unknown, ListFilesResponse> = {
    path: '/api/files/list',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
            });

            const { sessionId, path } = schema.parse(req.query);
            const files = await PVCFileOperationsService.getInstance().listFiles(sessionId, path);

            res.json({ success: true, data: { files } });
        } catch (error) {
            sendFileError(res, error, 'Failed to list files');
        }
    },
};
