import {ApiEndpoint, AuthType} from '../types';
import MariadbService from "../../services/mariadbService";

export interface DeleteSqlResponse {
    message: string;
}

export const deleteSqlEndpoint: ApiEndpoint<unknown, DeleteSqlResponse> = {
    path: '/api/database/sql/:name',
    method: 'delete',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            await MariadbService.getInstance().deleteSqlDatabase(name);


            res.json({
                success: true,
                data: {
                    message: 'SQL Database deleted successfully',
                }
            });
        } catch (error) {
            console.error('Failed to delete SQL database:', error);
            let message: string = 'Failed to delete SQL database';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};