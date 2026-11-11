import { ApiEndpoint, AuthType } from '../../types';
import { z } from 'zod';
import FileSessionService from '../../../services/fileSessionService';
import { FileEditSession, FileOperationError, FileOperationErrorCode } from '../../../types/fileSession';

interface CreateSessionRequest {
    deploymentName: string;
}

interface CreateSessionResponse {
    session: FileEditSession;
}

export const createSessionEndpoint: ApiEndpoint<CreateSessionRequest, CreateSessionResponse> = {
    path: '/api/files/session/create',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                deploymentName: z.string().min(1),
            });

            const { deploymentName } = schema.parse(req.body);

            const userId = req.user?.username;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Not signed in',
                });
                return;
            }

            const session = await FileSessionService.getInstance().createSession(
                deploymentName,
                userId
            );

            res.json({
                success: true,
                data: {
                    session,
                },
            });
        } catch (error) {
            console.error('Failed to create session:', error);
            const message = error instanceof Error ? error.message : 'Failed to create session';

            const status = error instanceof FileOperationError
                && error.code === FileOperationErrorCode.NO_SFTP_CREDENTIALS ? 400 : 500;

            res.status(status).json({
                success: false,
                error: message,
            });
        }
    },
};
