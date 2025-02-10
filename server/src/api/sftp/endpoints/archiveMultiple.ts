import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import JSZip from "jszip";
import sftpService from "../../../services/sftpService";

const fileSchema = z.object({
    path: z.string().min(1, { message: "File path must not be empty" }),
    name: z.string().min(1, { message: "File name must not be empty" }),
}).strict();

const archiveMultipleSchema = z.object({
    files: z.array(fileSchema).min(1, { message: "At least one file must be specified" }),
}).strict();

export type ArchiveMultipleRequest = z.infer<typeof archiveMultipleSchema>;

export interface ArchiveMultipleResponse {
    success: boolean,
    message: string,
    archivePath: string
}

export const archiveMultipleEndpoint: ApiEndpoint<ArchiveMultipleRequest, ArchiveMultipleResponse> = {
    path: '/api/sftp/archive-multiple',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: ArchiveMultipleRequest = archiveMultipleSchema.parse(req.body);
            const files = data.files;

            if (!files?.length) throw new Error('No files specified for archive');

            const zip = new JSZip();
            const currentDirectory = files[0].path.split('/').slice(0, -1).join('/');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archiveName = `archive_${timestamp}.zip`;

            for (const file of files) {
                const pathContents = await sftpService.listSFTPFiles(file.path.split('/').slice(0, -1).join('/'));
                const fileInfo = pathContents.find(f => f.name === file.path.split('/').pop());

                if (fileInfo && fileInfo.type === 'd') {
                    const folderContents = await sftpService.listSFTPRecursive(file.path);
                    for (const item of folderContents) {
                        if (item.type !== 'd') {
                            const relativePath = item.path.replace(file.path, '').replace(/^\//, '');
                            const fileBuffer = await sftpService.downloadSFTPFile(item.path);
                            zip.file(`${file.name}/${relativePath}`, fileBuffer as Buffer);
                        }
                    }
                } else {
                    const fileBuffer = await sftpService.downloadSFTPFile(file.path);
                    zip.file(file.name, fileBuffer as Buffer);
                }
            }

            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE',
                comment: `Archived on ${new Date().toISOString()}`
            });

            const archivePath = `${currentDirectory}/${archiveName}`;
            await sftpService.uploadSFTPFile(zipBuffer, archivePath);


            res.json({
                success: true,
                data: {
                    success: true,
                    message: 'Files archived successfully',
                    archivePath: archivePath
                }
            });
        } catch (error) {
            console.error('Error archiving files:', error);
            let message: string = error.message;

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};


