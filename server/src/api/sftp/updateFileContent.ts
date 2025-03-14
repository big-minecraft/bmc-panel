import {ApiEndpoint, AuthType} from '../types';
import {z} from "zod";
import SftpService from "../../services/sftpService";

const updateFileContentSchema = z.object({
    path: z.string().min(1),
    content: z.string().min(1),
}).strict();

export type UpdateFileContentRequest = z.infer<typeof updateFileContentSchema>;


export interface UpdateFileContentResponse {
    message: string;
}

export const updateFileContentEndpoint: ApiEndpoint<UpdateFileContentRequest, UpdateFileContentResponse> = {
    path: '/api/sftp/file/content',
    method: 'patch',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: UpdateFileContentRequest = updateFileContentSchema.parse(req.body);
            
            await SftpService.getInstance().updateSFTPFile(data.path, data.content);

            res.json({
                success: true,
                data: {
                    message: 'File updated successfully',
                }
            });
        } catch (error) {
            console.error('Failed to update file content:', error);
            let message: string = 'Failed to update file content';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};