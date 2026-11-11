import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import ConfigManager from '../../features/config/controllers/configManager';
import { sendFileError } from './respond';

interface GetFileContentResponse {
    content: string;
}

export const getFileContentEndpoint: ApiEndpoint<unknown, GetFileContentResponse> = {
    path: '/api/files/get-content',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                path: z.string().min(1),
            });

            const { sessionId, path } = schema.parse(req.body);
            const content = await PVCFileOperationsService.getInstance()
                .readTextFile(sessionId, path, maxEditorBytes());

            res.json({ success: true, data: { content } });
        } catch (error) {
            sendFileError(res, error, 'Failed to read file');
        }
    },
};

function maxEditorBytes(): number {
    const configured = ConfigManager.getConfig().fileEditSession.maxEditorFileMb;
    return configured * 1024 * 1024;
}
