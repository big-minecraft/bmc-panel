import { ApiEndpoint, AuthType } from '../types';
import DatabaseService from '../../services/databaseService';
import { SshKey, requireUser, toSshKey } from './types';

export interface GetSshKeysResponse {
    keys: SshKey[];
}

export const getSshKeysEndpoint: ApiEndpoint<unknown, GetSshKeysResponse> = {
    path: '/api/profile/ssh-keys',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const user = await requireUser(req);
            const records = await DatabaseService.getInstance().getSshKeysByUserId(user.id);

            res.json({
                success: true,
                data: {
                    keys: records.map(toSshKey),
                },
            });
        } catch (error) {
            console.error('Failed to fetch ssh keys:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to fetch SSH keys',
            });
        }
    },
};
