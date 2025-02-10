import {ApiEndpoint, AuthType} from '../../types';
import mariadbService from "../../../services/mariadbService";
import mongodbService from "../../../services/mongodbService";

export interface ResetMongoPasswordResponse {
    message: string;
    username: string;
    password: string;
}

export const resetMongoPasswordEndpoint: ApiEndpoint<unknown, ResetMongoPasswordResponse> = {
    path: '/api/database/mongo/:name',
    method: 'patch',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            const {username, password} = await mongodbService.resetMongoDatabasePassword(name);


            res.json({
                success: true,
                data: {
                    message: 'SQL Database password reset successfully',
                    username,
                    password
                }
            });
        } catch (error) {
            console.error('Failed to reset Mongo database password:', error);
            let message: string = 'Failed to reset Mongo database password';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};