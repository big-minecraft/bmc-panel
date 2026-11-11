import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import { sendFileError } from './respond';

interface DeletePathsRequest {
    sessionId: string;
    paths: string[];
}

interface DeletePathsResponse {
    deleted: number;
}

export const deletePathsEndpoint: ApiEndpoint<DeletePathsRequest, DeletePathsResponse> = {
    path: '/api/files/delete',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                paths: z.array(z.string().min(1)).min(1),
            });

            const { sessionId, paths } = schema.parse(req.body);
            await PVCFileOperationsService.getInstance().deletePaths(sessionId, paths);

            res.json({ success: true, data: { deleted: paths.length } });
        } catch (error) {
            sendFileError(res, error, 'Failed to delete');
        }
    },
};
