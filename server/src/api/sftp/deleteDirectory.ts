import {ApiEndpoint, AuthType} from '../types';
import {z} from "zod";
import SftpService from "../../services/sftpService";

const deleteDirectorySchema = z.object({
    path: z.string().min(1),
}).strict();

export type DeleteDirectoryRequest = z.infer<typeof deleteDirectorySchema>;

export interface DeleteDirectoryResponse {
    message: string;
}

export const deleteDirectoryEndpoint: ApiEndpoint<DeleteDirectoryRequest, DeleteDirectoryResponse> = {
    path: '/api/sftp/directory',
    method: 'delete',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: DeleteDirectoryRequest = deleteDirectorySchema.parse(req.query);
            
            await SftpService.getInstance().deleteSFTPDirectory(data.path);
            
            res.json({
                success: true,
                data: {
                    message: 'Directory deleted successfully',
                }
            });
        } catch (error) {
            console.error('Failed to delete directory:', error);
            let message: string = 'Failed to delete directory';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};