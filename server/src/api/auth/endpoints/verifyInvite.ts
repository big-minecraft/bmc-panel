import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import inviteCodeService from "../../../services/inviteCodeService";

const verifyInviteSchema = z.object({
    inviteCode: z.string().min(1).nullish(),
}).strict();

export type VerifyInviteRequest = z.infer<typeof verifyInviteSchema>;

export interface VerifyInviteResponse {
    token: string;
}

export const verifyInviteEndpoint: ApiEndpoint<VerifyInviteRequest, VerifyInviteResponse> = {
    path: '/api/auth/verify-invite',
    method: 'post',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const data: VerifyInviteRequest = verifyInviteSchema.parse(req.body);

            //TODO: Move this to the auth controller

            let token = await inviteCodeService.verifyInvite(data.inviteCode);

            res.json({
                success: true,
                data: {
                    token: token,
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Invalid invite code'
            });
        }
    }
};
