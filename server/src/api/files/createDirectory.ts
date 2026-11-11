import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import { sendFileError } from './respond';

interface CreateDirectoryRequest {
    sessionId: string;
    path: string;
}

interface CreateDirectoryResponse {
    message: string;
}

export const createDirectoryEndpoint: ApiEndpoint<CreateDirectoryRequest, CreateDirectoryResponse> = {
    path: '/api/files/create-directory',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
            });

            const { sessionId, path } = schema.parse(req.body);
            await PVCFileOperationsService.getInstance().createDirectory(sessionId, path);

            res.json({ success: true, data: { message: 'Directory created' } });
        } catch (error) {
            sendFileError(res, error, 'Failed to create directory');
        }
    },
};
