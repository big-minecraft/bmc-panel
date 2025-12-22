import { ApiEndpoint, AuthType } from '../../types';
import { z } from 'zod';
import FileSessionService from '../../../services/fileSessionService';

interface EndSessionRequest {
    sessionId: string;
}

interface EndSessionResponse {
    message: string;
}

export const endSessionEndpoint: ApiEndpoint<EndSessionRequest, EndSessionResponse> = {
    path: '/api/files/session/end',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
            });

            const { sessionId } = schema.parse(req.body);

            await FileSessionService.getInstance().terminateSession(sessionId);

            res.json({
                success: true,
                data: {
                    message: 'Session terminated successfully',
                },
            });
        } catch (error) {
            console.error('Failed to end session:', error);
            const message = error instanceof Error ? error.message : 'Failed to end session';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
