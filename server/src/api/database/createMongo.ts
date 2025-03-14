import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import MongodbService from "../../services/mongodbService";

const createMongoSchema = z.object({
    name: z.string().min(1),
}).strict();

export type CreateMongoRequest = z.infer<typeof createMongoSchema>;

export interface CreateMongoResponse {
   message: string;
}

export const createMongoEndpoint: ApiEndpoint<CreateMongoRequest, CreateMongoResponse> = {
    path: '/api/database/mongo',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: CreateMongoRequest = createMongoSchema.parse(req.body);
            await MongodbService.getInstance().createMongoDatabase(data.name);

            res.json({
                success: true,
                data: {
                    message: 'Mongo Database created successfully',
                }
            });
        } catch (error) {
            console.error('Failed to create Mongo database:', error);
            let message: string = 'Failed to create Mongo database';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};