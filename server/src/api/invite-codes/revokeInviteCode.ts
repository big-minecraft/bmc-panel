import {ApiEndpoint, AuthType} from '../types';
import {z} from "zod";
import DatabaseService from "../../services/databaseService";

const revokeInviteCodeSchema = z.object({
    code: z.string().min(1),
}).strict();

export type RevokeInviteCodeRequest = z.infer<typeof revokeInviteCodeSchema>;

export interface RevokeInviteCodeResponse {
    message: string;
}

export const revokeInviteCodeEndpoint: ApiEndpoint<RevokeInviteCodeRequest, RevokeInviteCodeResponse> = {
    path: '/api/invite-codes/:code',
    method: 'delete',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const data: RevokeInviteCodeRequest = revokeInviteCodeSchema.parse(req.params);

            await DatabaseService.getInstance().revokeInviteCode(data.code);
            res.json({
                success: true,
                data: {
                    message: 'Invite code revoked successfully',
                }
            });
        } catch (error) {
            console.error('Failed to revoke invite code:', error);
            let message: string = 'Failed to revoke invite code';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};