import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import DatabaseService from "../../services/databaseService";

export interface LogoutResponse {
    message: string;
}

export const logoutEndpoint: ApiEndpoint<unknown, LogoutResponse> = {
    path: '/api/auth/logout',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {

            //TODO: Move this to the auth controller

            await DatabaseService.getInstance().logout(req.user.username);

            res.json({
                success: true,
                data: {
                    message: 'Logged out successfully',
                }
            });
        } catch (error) {

            console.error('Failed to log out user', error);

            res.status(500).json({
                success: false,
                error: 'Failed to log out user'
            });
        }
    }
};