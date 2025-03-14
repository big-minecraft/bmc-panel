import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import JSZip from "jszip";
import SftpService from "../../services/sftpService";

const archiveFileSchema = z.object({
    path: z.string().min(1),
}).strict();

export type ArchiveFileRequest = z.infer<typeof archiveFileSchema>;

export interface ArchiveFileResponse {
    success: boolean,
    message: string,
    archivePath: string
}

export const archiveFileEndpoint: ApiEndpoint<ArchiveFileRequest, ArchiveFileResponse> = {
    path: '/api/sftp/archive',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: ArchiveFileRequest = archiveFileSchema.parse(req.body);
            const path = data.path;

            const fileBuffer = await SftpService.getInstance().downloadSFTPFile(path);
            const filename = path.split('/').pop();
            const directoryPath = path.split('/').slice(0, -1).join('/');
            const zip = new JSZip();

            zip.file(filename, fileBuffer as Buffer);


            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });
            const archivePath = `${directoryPath}/${filename}.zip`;
            await SftpService.getInstance().uploadSFTPFile(zipBuffer, archivePath);
            
            res.json({
                success: true,
                data: {
                    success: true,
                    message: 'File archived successfully',
                    archivePath: archivePath
                }
            });
        } catch (error) {
            console.error('Error archiving file:', error);
            let message: string = 'Failed to archive file';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};