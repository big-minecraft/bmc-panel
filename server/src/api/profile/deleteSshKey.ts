import { ApiEndpoint, AuthType } from '../types';
import DatabaseService from '../../services/databaseService';
import { requireUser } from './types';

export interface DeleteSshKeyResponse {
    message: string;
}

export const deleteSshKeyEndpoint: ApiEndpoint<unknown, DeleteSshKeyResponse> = {
    path: '/api/profile/ssh-keys/:id',
    method: 'delete',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const user = await requireUser(req);
            const keyId = parseInt(req.params.id as string, 10);

            if (!Number.isInteger(keyId)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid key id',
                });
                return;
            }

            const deleted = await DatabaseService.getInstance().deleteSshKey(user.id, keyId);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'SSH key not found',
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    message: 'SSH key removed',
                },
            });
        } catch (error) {
            console.error('Failed to delete ssh key:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to remove SSH key',
            });
        }
    },
};
