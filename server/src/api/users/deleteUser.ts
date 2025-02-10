import {ApiEndpoint, AuthType} from '../types';
import databaseService from "../../services/databaseService";

export interface DeleteUserResponse {
    message: string;
}

export const deleteUserEndpoint: ApiEndpoint<unknown, DeleteUserResponse> = {
    path: '/api/users/:id',
    method: 'delete',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const id: number = parseInt(req.params.id);

            await databaseService.deleteUser(id);

            res.json({
                success: true,
                data: {
                    message: 'User deleted successfully',
                }
            });
        } catch (error) {
            console.error('Failed to delete user:', error);
            let message: string = 'Failed to delete user';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};