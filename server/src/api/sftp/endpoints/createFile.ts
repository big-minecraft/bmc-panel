import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import sftpService from "../../../services/sftpService";

const createFileSchema = z.object({
    path: z.string().min(1),
    content: z.string(),
}).strict();

export type CreateFileRequest = z.infer<typeof createFileSchema>;

export interface CreateFileResponse {
    message: string;
}

export const createFileEndpoint: ApiEndpoint<CreateFileRequest, CreateFileResponse> = {
    path: '/api/sftp/file',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: CreateFileRequest = createFileSchema.parse(req.body);
            await sftpService.createSFTPFile(data.path, data.content);
            res.json({
                success: true,
                data: {
                    message: 'File created successfully',
                }
            });
        } catch (error) {
            console.error('Failed to create file:', error);
            let message: string = 'Failed to create file';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};