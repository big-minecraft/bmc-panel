import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import sftpService from "../../services/sftpService";

const createDirectorySchema = z.object({
    path: z.string().min(1),
}).strict();

export type CreateDirectoryRequest = z.infer<typeof createDirectorySchema>;

export interface CreateDirectoryResponse {
    message: string;
}

export const createDirectoryEndpoint: ApiEndpoint<CreateDirectoryRequest, CreateDirectoryResponse> = {
    path: '/api/sftp/directory',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: CreateDirectoryRequest = createDirectorySchema.parse(req.body);
            await sftpService.createSFTPDirectory(data.path);
            res.json({
                success: true,
                data: {
                    message: 'Directory created successfully',
                }
            });
        } catch (error) {
            console.error('Failed to create directory:', error);
            let message: string = 'Failed to create directory';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};