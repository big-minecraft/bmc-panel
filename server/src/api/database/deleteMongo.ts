import {ApiEndpoint, AuthType} from '../types';
import mongodbService from "../../services/mongodbService";


export interface DeleteMongoResponse {
    message: string;
}

export const deleteMongoEndpoint: ApiEndpoint<unknown, DeleteMongoResponse> = {
    path: '/api/database/mongo/:name',
    method: 'delete',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            await mongodbService.deleteMongoDatabase(name);


            res.json({
                success: true,
                data: {
                    message: 'Mongo Database deleted successfully',
                }
            });
        } catch (error) {
            console.error('Failed to delete Mongo database:', error);
            let message: string = 'Failed to delete Mongo database';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};