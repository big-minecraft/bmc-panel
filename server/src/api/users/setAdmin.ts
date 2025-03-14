import {ApiEndpoint, AuthType} from '../types';
import {z} from "zod";
import DatabaseService from "../../services/databaseService";

const setAdminSchema = z.object({
    is_admin: z.boolean(),
}).strict();

export type SetAdminRequest = z.infer<typeof setAdminSchema>;


export interface SetAdminResponse {
    message: string;
}

export const setAdminEndpoint: ApiEndpoint<SetAdminRequest, SetAdminResponse> = {
    path: '/api/users/:id/admin',
    method: 'patch',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            let databaseService = DatabaseService.getInstance();

            const data: SetAdminRequest = setAdminSchema.parse(req.body);
            const id = parseInt(req.params.id as string);

            await databaseService.setAdmin(id, data.is_admin);
            let dbUser = await databaseService.getUserByID(id);
            await databaseService.logout(dbUser.username);

            res.json({
                success: true,
                data: {
                    message: 'Updated user admin status',
                }
            });
        } catch (error) {
            console.error('Failed to set user admin status:', error);
            let message: string = 'Failed to set user admin status';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};