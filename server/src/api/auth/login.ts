import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import authController from '../../services/authService';

const loginSchema = z.object({
    username: z.string().min(1).nullish(),
    password: z.string().min(1).nullish(),
}).strict();

export type LoginRequest = z.infer<typeof loginSchema>;

export interface LoginResponse {
    sessionToken: string;
}

export const loginEndpoint: ApiEndpoint<LoginRequest, LoginResponse> = {
    path: '/api/auth/login',
    method: 'post',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const data: LoginRequest = loginSchema.parse(req.body);
            const sessionToken = await authController.login(data.username, data.password);


            res.json({
                success: true,
                data: {
                    sessionToken: sessionToken,
                }
            });
        } catch (error) {
            let message: string = 'Failed to login';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};