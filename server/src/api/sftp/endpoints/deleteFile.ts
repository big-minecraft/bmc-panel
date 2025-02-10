import {ApiEndpoint, AuthType} from '../../types';
import {z} from "zod";
import sftpService from "../../../services/sftpService";

const deleteFileSchema = z.object({
    path: z.string().min(1),
}).strict();

export type DeleteFileRequest = z.infer<typeof deleteFileSchema>;

export interface DeleteFileResponse {
    message: string;
}

export const deleteFileEndpoint: ApiEndpoint<DeleteFileRequest, DeleteFileResponse> = {
    path: '/api/sftp/file',
    method: 'delete',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: DeleteFileRequest = deleteFileSchema.parse(req.query);

            await sftpService.deleteSFTPFile(data.path);

            res.json({
                success: true,
                data: {
                    message: 'File deleted successfully',
                }
            });
        } catch (error) {
            console.error('Failed to delete file:', error);
            let message: string = 'Failed to delete file';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};
