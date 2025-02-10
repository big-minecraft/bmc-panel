import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import sftpService from "../../services/sftpService";

const moveFileSchema = z.object({
    sourcePath: z.string().min(1),
    targetPath: z.string().min(1),
}).strict();

export type MoveFileRequest = z.infer<typeof moveFileSchema>;

export interface MoveFileResponse {
    message: string;
}

export const moveFileEndpoint: ApiEndpoint<MoveFileRequest, MoveFileResponse> = {
    path: '/api/sftp/move',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: MoveFileRequest = moveFileSchema.parse(req.body);
            await sftpService.moveFileOrFolder(data.sourcePath, data.targetPath)
            
            res.json({
                success: true,
                data: {
                    message: 'File(s) moved successfully',
                }
            });
        } catch (error) {
            console.error('Failed to move file(s):', error);
            let message: string = 'Failed to move file(s)';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};