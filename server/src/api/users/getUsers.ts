import {ApiEndpoint, AuthType} from '../types';
import DatabaseService from "../../services/databaseService";

export interface GetUsersResponse {
    users: any[];
}

export const getUsersEndpoint: ApiEndpoint<unknown, GetUsersResponse> = {
    path: '/api/users',
    method: 'get',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const users = await DatabaseService.getInstance().getUsers()
            res.json({
                success: true,
                data: {
                    users
                }
            });
        } catch (error) {
            console.error('Failed to fetch users:', error);
            let message: string = 'Failed to fetch users';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};
