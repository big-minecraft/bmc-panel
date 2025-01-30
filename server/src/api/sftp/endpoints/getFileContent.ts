import {ApiEndpoint, AuthType} from '../../types';
import sftpService from "../../../services/sftpService";

export interface GetFileContentResponse {
    content: string | Buffer | NodeJS.WritableStream;
}

export const getFileContentEndpoint: ApiEndpoint<unknown, GetFileContentResponse> = {
    path: '/api/sftp/file/content',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const path = req.query.path as string;

            const content = await sftpService.getSFTPFileContent(path);

            res.json({
                success: true,
                data: {
                    content
                }
            });
        } catch (error) {
            console.error('Failed to fetch file content:', error);
            let message: string = 'Failed to fetch file content';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};