import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import sftpService from "../../../services/sftpService";

const downloadFileSchema = z.object({
    path: z.string().min(1),
}).strict();

export type DownloadFileRequest = z.infer<typeof downloadFileSchema>;

export const downloadFileEndpoint: ApiEndpoint<DownloadFileRequest> = {
    path: '/api/sftp/download',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: DownloadFileRequest = downloadFileSchema.parse(req.body);
            const path = data.path;

            const fileBuffer = await sftpService.downloadSFTPFile(path);
            const filename = path.split('/').pop();

            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            res.send(fileBuffer);
        } catch (error) {
            console.error('Error downloading file:', error);
            let message: string = 'Failed to download file';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};