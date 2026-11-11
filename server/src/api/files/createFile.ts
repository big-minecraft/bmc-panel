import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import { sendFileError } from './respond';

interface CreateFileRequest {
    sessionId: string;
    path: string;
    content: string;
}

interface CreateFileResponse {
    message: string;
}

export const createFileEndpoint: ApiEndpoint<CreateFileRequest, CreateFileResponse> = {
    path: '/api/files/create',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
                content: z.string(),
            });

            const { sessionId, path, content } = schema.parse(req.body);
            await PVCFileOperationsService.getInstance().writeFile(sessionId, path, content);

            res.json({ success: true, data: { message: 'File created' } });
        } catch (error) {
            sendFileError(res, error, 'Failed to create file');
        }
    },
};
