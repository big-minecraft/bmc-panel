import { ApiEndpoint, AuthType } from '../../types';
import FileSessionService from '../../../services/fileSessionService';
import { FileEditSession } from '../../../types/fileSession';

interface GetSessionStatusResponse {
    session: FileEditSession;
}

export const getSessionStatusEndpoint: ApiEndpoint<unknown, GetSessionStatusResponse> = {
    path: '/api/files/session/status',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const sessionId = req.query.sessionId as string;

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId query parameter is required',
                });
                return;
            }

            const session = await FileSessionService.getInstance().getSession(sessionId);

            if (!session) {
                res.status(404).json({
                    success: false,
                    error: 'Session not found',
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    session,
                },
            });
        } catch (error) {
            console.error('Failed to get session status:', error);
            const message = error instanceof Error ? error.message : 'Failed to get session status';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
