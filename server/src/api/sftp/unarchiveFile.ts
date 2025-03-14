import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import UnzipService from "../../services/unzipService";

const unarchiveFileSchema = z.object({
    path: z.string().min(1),
}).strict();

export type UnarchiveFileRequest = z.infer<typeof unarchiveFileSchema>;

export interface UnarchiveFileResponse {
    message: string,
}

export const unarchiveFileEndpoint: ApiEndpoint<UnarchiveFileRequest, UnarchiveFileResponse> = {
    path: '/api/sftp/unarchive',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: UnarchiveFileRequest = unarchiveFileSchema.parse(req.body);
            const path = data.path;

            await UnzipService.getInstance().unarchiveFile(path);
            
            res.json({
                success: true,
                data: {
                    message: 'File ununarchived successfully',
                }
            });
        } catch (error) {
            console.error('Error unarchiving file:', error);
            let message: string = 'Failed to ununarchive file';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};