import { ApiEndpoint, AuthType } from '../../types';
import FileSessionService from '../../../services/fileSessionService';
import { FileEditSession } from '../../../types/fileSession';

interface ListSessionsResponse {
    sessions: FileEditSession[];
}

export const listSessionsEndpoint: ApiEndpoint<unknown, ListSessionsResponse> = {
    path: '/api/files/session/list',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const deploymentName = req.query.deploymentName as string | undefined;
            let sessions: FileEditSession[];

            if (deploymentName) {
                sessions = await FileSessionService.getInstance().listSessionsByDeployment(deploymentName);
            } else {
                sessions = await FileSessionService.getInstance().listAllActiveSessions();
            }

            res.json({
                success: true,
                data: {
                    sessions,
                },
            });
        } catch (error) {
            console.error('Failed to list sessions:', error);
            const message = error instanceof Error ? error.message : 'Failed to list sessions';

            res.status(500).json({
                success: false,
                error: message,
            });
        }
    },
};
