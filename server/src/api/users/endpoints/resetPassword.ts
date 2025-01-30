import {ApiEndpoint, AuthType} from '../../types';
import {z} from "zod";
import databaseService from "../../../services/databaseService";

const resetPasswordSchema = z.object({
    password: z.string().min(1),
}).strict();

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export interface ResetPasswordResponse {
    message: string;
}

export const resetPasswordEndpoint: ApiEndpoint<unknown, ResetPasswordResponse> = {
    path: '/api/users/:id/password',
    method: 'patch',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const id = parseInt(req.params.id as string);
            const data: ResetPasswordRequest = resetPasswordSchema.parse(req.body);


            await databaseService.resetPassword(id, data.password);


            res.json({
                success: true,
                data: {
                    message: 'Password reset successfully',
                }
            });
        } catch (error) {
            console.error('Failed to reset password:', error);
            let message: string = 'Failed to reset password';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};

