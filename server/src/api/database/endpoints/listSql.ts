import {ApiEndpoint, AuthType} from '../../types';
import mariadbService, {DatabaseInfo} from "../../../services/mariadbService";

export interface ListSqlResponse {
    databases: DatabaseInfo[];
}

export const listSqlEndpoint: ApiEndpoint<unknown, ListSqlResponse> = {
    path: '/api/database/sql',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const databases: DatabaseInfo[] = await mariadbService.listSqlDatabases();

            const sanitizedDatabases: DatabaseInfo[] = databases.map(db => ({
                ...db,
                tables: parseInt(db.tables.toString())
            }));


            res.json({
                success: true,
                data: {
                    databases: sanitizedDatabases,
                }
            });
        } catch (error) {
            console.error('Failed to list SQL databases:', error);
            let message: string = 'Failed to fetch SQL databases';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};