import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import databaseService from "../../../services/databaseService";

const logoutSchema = z.object({
    user: z.object({
        username: z.string().min(1).nullish()
    })
}).strict();

export type LogoutRequest = z.infer<typeof logoutSchema>;

export interface LogoutResponse {
    message: string;
}

export const logoutEndpoint: ApiEndpoint<LogoutRequest, LogoutResponse> = {
    path: '/api/auth/logout',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: LogoutRequest = logoutSchema.parse(req.body);

            //TODO: Move this to the auth controller

            await databaseService.logout(data.user.username);

            res.json({
                success: true,
                data: {
                    message: 'Logged out successfully',
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to log out user'
            });
        }
    }
};