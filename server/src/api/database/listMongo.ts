import {ApiEndpoint, AuthType} from '../types';
import {DatabaseInfo} from "../../services/mongodbService";
import MongodbService from "../../services/mongodbService";

export interface ListMongoResponse {
    databases: DatabaseInfo[];
}

export const listMongoEndpoint: ApiEndpoint<unknown, ListMongoResponse> = {
    path: '/api/database/mongo',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const databases: DatabaseInfo[] = await MongodbService.getInstance().listMongoDatabases();

            const sanitizedDatabases: DatabaseInfo[] = databases.map(db => ({
                ...db,
                tables: parseInt(db.collections.toString())
            }));


            res.json({
                success: true,
                data: {
                    databases: sanitizedDatabases,
                }
            });
        } catch (error) {
            console.error('Failed to list Mongo databases:', error);
            let message: string = 'Failed to fetch Mongo databases';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};