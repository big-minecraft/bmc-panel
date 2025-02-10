import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import authController from '../../services/authService';

const registerSchema = z.object({
    username: z.string().min(1).nullish(),
    password: z.string().min(1).nullish(),
    inviteToken: z.string().nullish(),
}).strict();

export type RegisterRequest = z.infer<typeof registerSchema>;

export interface RegisterResponse {
    message: string;
    qrCode: string;
}

    export const registerEndpoint: ApiEndpoint<RegisterRequest, RegisterResponse> = {
    path: '/api/auth/register',
    method: 'post',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const data: RegisterRequest = registerSchema.parse(req.body);
            const data_url = await authController.register(data.username, data.password, data.inviteToken);

            res.json({
                success: true,
                data: {
                    message: 'User registered successfully',
                    qrCode: data_url
                }
            });
        } catch (error) {
            let message: string;

            if (error.message === 'User already exists') message = error.message;
            else message = 'Failed to register user';

            console.error(message, error)

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};