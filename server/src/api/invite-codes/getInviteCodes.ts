import {ApiEndpoint, AuthType} from '../types';
import DatabaseService from "../../services/databaseService";

export interface GetInviteCodesResponse {
    codes: any[];
}

export const getInviteCodesEndpoint: ApiEndpoint<unknown, GetInviteCodesResponse> = {
    path: '/api/invite-codes',
    method: 'get',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const codes = await DatabaseService.getInstance().getInviteCodes();
            res.json({
                success: true,
                data: {
                    codes
                }
            });
        } catch (error) {
            console.error('Failed to fetch invite codes:', error);
            let message: string = 'Failed to fetch invite codes';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};