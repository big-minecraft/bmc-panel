import { ApiEndpoint, AuthType } from '../../types';
import { z } from 'zod';
import FileSessionService from '../../../services/fileSessionService';
import { FileEditSession } from '../../../types/fileSession';

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

            // Get userId from auth middleware
            const userId = req.auth?.userId?.toString() || 'unknown';

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

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
