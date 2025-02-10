import {ApiEndpoint, AuthType} from '../../types';
import mariadbService from "../../../services/mariadbService";

export interface ResetSqlPasswordResponse {
    message: string;
    username: string;
    password: string;
}

export const resetSqlPasswordEndpoint: ApiEndpoint<unknown, ResetSqlPasswordResponse> = {
    path: '/api/database/sql/:name',
    method: 'patch',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            const {username, password} = await mariadbService.resetSqlDatabasePassword(name);


            res.json({
                success: true,
                data: {
                    message: 'SQL Database password reset successfully',
                    username,
                    password
                }
            });
        } catch (error) {
            console.error('Failed to reset SQL database password:', error);
            let message: string = 'Failed to reset SQL database password';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};