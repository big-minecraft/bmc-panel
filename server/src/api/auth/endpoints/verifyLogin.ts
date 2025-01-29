import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import authController from '../../../services/authService';

const verifyLoginSchema = z.object({
    username: z.string().min(1).nullish(),
    token: z.string().min(1).nullish(),
    sessionToken: z.string().nullish(),
}).strict();

export type VerifyLoginRequest = z.infer<typeof verifyLoginSchema>;

export interface VerifyLoginResponse {
    token: string;
}

export const verifyLoginEndpoint: ApiEndpoint<VerifyLoginRequest, VerifyLoginResponse> = {
    path: '/api/auth/verify-login',
    method: 'post',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const data: VerifyLoginRequest = verifyLoginSchema.parse(req.body);
            const jwtToken = await authController.verifyLogin(data.username, data.token, data.sessionToken);


            res.json({
                success: true,
                data: {
                    token: jwtToken,
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};