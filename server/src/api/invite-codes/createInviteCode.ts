import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import databaseService from "../../services/databaseService";

const createInviteCodeSchema = z.object({
    message: z.string().min(1),
}).strict();

export type CreateInviteCodeRequest = z.infer<typeof createInviteCodeSchema>;

export interface CreateInviteCodeResponse {
    message: string;
}

export const createInviteCodeEndpoint: ApiEndpoint<CreateInviteCodeRequest, CreateInviteCodeResponse> = {
    path: '/api/invite-codes',
    method: 'post',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const data: CreateInviteCodeRequest = createInviteCodeSchema.parse(req.body);
            await databaseService.createInviteCode(data.message)
            res.json({
                success: true,
                data: {
                    message: 'Invite code created successfully',
                }
            });
        } catch (error) {
            console.error('Failed to create invite code:', error);
            let message: string = 'Failed to create invite code';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};
