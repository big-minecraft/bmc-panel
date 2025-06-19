import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import authController from '../../services/authService';
import DatabaseService from "../../services/databaseService";
import AuthService from "../../services/authService";

const verifyRegistrationSchema = z.object({
    username: z.string().min(1).nullish(),
    token: z.string().min(1).nullish(),
    inviteToken: z.string().nullish(),
}).strict();

export type VerifyRegistrationRequest = z.infer<typeof verifyRegistrationSchema>;

export interface VerifyRegistrationResponse {
    loginToken: string;
    isAdmin: boolean;
}

export const verifyRegistrationEndpoint: ApiEndpoint<VerifyRegistrationRequest, VerifyRegistrationResponse> = {
    path: '/api/auth/verify-registration',
    method: 'post',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const data: VerifyRegistrationRequest = verifyRegistrationSchema.parse(req.body);
            const loginToken = await AuthService.getInstance().verifyRegistration(data.username, data.token, data.inviteToken);
            let dbUser = await DatabaseService.getInstance().getUser(data.username);
            let isAdmin = dbUser.is_admin;

            res.json({
                success: true,
                data: {
                    loginToken: loginToken,
                    isAdmin: isAdmin
                }
            });
        } catch (error) {
            let message: string = 'Failed to verify registration token';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};