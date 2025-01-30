import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import mariadbService from "../../../services/mariadbService";

const createSqlSchema = z.object({
    name: z.string().min(1),
}).strict();

export type CreateSqlRequest = z.infer<typeof createSqlSchema>;

export interface CreateSqlResponse {
   message: string;
}

export const createSqlEndpoint: ApiEndpoint<CreateSqlRequest, CreateSqlResponse> = {
    path: '/api/database/sql',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: CreateSqlRequest = createSqlSchema.parse(req.body);

            await mariadbService.createSqlDatabase(data.name);


            res.json({
                success: true,
                data: {
                    message: 'SQL Database created successfully',
                }
            });
        } catch (error) {
            console.error('Failed to create SQL database:', error);
            let message: string = 'Failed to create SQL database';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};