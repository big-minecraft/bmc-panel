import { ApiEndpoint, AuthType } from '../types';
import ConfigManager from '../../features/config/controllers/configManager';
import { requireUser } from './types';

export interface GetProfileResponse {
    username: string;
    isAdmin: boolean;
    authProvider: string;
    sftp: {
        passwordAuth: boolean;
    };
}

export const getProfileEndpoint: ApiEndpoint<unknown, GetProfileResponse> = {
    path: '/api/profile',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const user = await requireUser(req);
            const config = ConfigManager.getConfig();

            res.json({
                success: true,
                data: {
                    username: user.username,
                    isAdmin: Boolean(user.is_admin),
                    authProvider: user.auth_provider || 'local',
                    sftp: {
                        passwordAuth: config.sftp?.passwordAuth !== false,
                    },
                },
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);

            res.status(500).json({
                success: false,
                error: 'Failed to fetch profile',
            });
        }
    },
};
