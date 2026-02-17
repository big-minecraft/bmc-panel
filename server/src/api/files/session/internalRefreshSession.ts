import { ApiEndpoint, AuthType } from '../../types';
import { z } from 'zod';
import FileSessionService from '../../../services/fileSessionService';

interface InternalRefreshSessionRequest {
    sessionId: string;
}

interface InternalRefreshSessionResponse {
    message: string;
}

export const internalRefreshSessionEndpoint: ApiEndpoint<InternalRefreshSessionRequest, InternalRefreshSessionResponse> = {
    path: '/api/files/session/internal-refresh',
    method: 'post',
    auth: AuthType.ServiceToken,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
            });

            const { sessionId } = schema.parse(req.body);

            await FileSessionService.getInstance().refreshActivity(sessionId);

            res.json({
                success: true,
                data: {
                    message: 'Session refreshed successfully',
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to refresh session';
            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
