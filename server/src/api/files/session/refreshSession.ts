import { ApiEndpoint, AuthType } from '../../types';
import { z } from 'zod';
import FileSessionService from '../../../services/fileSessionService';

interface RefreshSessionRequest {
    sessionId: string;
}

interface RefreshSessionResponse {
    message: string;
    lastActivity: number;
}

export const refreshSessionEndpoint: ApiEndpoint<RefreshSessionRequest, RefreshSessionResponse> = {
    path: '/api/files/session/refresh',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
            });

            const { sessionId } = schema.parse(req.body);

            await FileSessionService.getInstance().refreshActivity(sessionId);

            const session = await FileSessionService.getInstance().getSession(sessionId);

            res.json({
                success: true,
                data: {
                    message: 'Session refreshed successfully',
                    lastActivity: session?.lastActivity || Date.now(),
                },
            });
        } catch (error) {
            console.error('Failed to refresh session:', error);
            const message = error instanceof Error ? error.message : 'Failed to refresh session';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
