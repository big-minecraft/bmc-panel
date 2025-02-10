import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import JSZip from "jszip";
import sftpService from "../../services/sftpService";

const fileSchema = z.object({
    path: z.string().min(1, { message: "File path must not be empty" }),
    name: z.string().min(1, { message: "File name must not be empty" }),
}).strict();

const downloadMultipleSchema = z.object({
    files: z.array(fileSchema).min(1, { message: "At least one file must be specified" }),
}).strict();

export type DownloadMultipleRequest = z.infer<typeof downloadMultipleSchema>;

export const downloadMultipleEndpoint: ApiEndpoint<DownloadMultipleRequest> = {
    path: '/api/sftp/download-multiple',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: DownloadMultipleRequest = downloadMultipleSchema.parse(req.body);
            const files = data.files;

            if (!files?.length) throw new Error('No files specified for download');

            const zip = new JSZip();
            
            for (const file of files) {
                const pathContents = await sftpService.listSFTPFiles(file.path.split('/').slice(0, -1).join('/'));
                const fileInfo = pathContents.find(f => f.name === file.path.split('/').pop());

                if (fileInfo && fileInfo.type === 'd') {
                    const contents = await sftpService.listSFTPFiles(file.path);
                    for (const item of contents) {
                        if (item.type !== 'd') {
                            const fileBuffer = await sftpService.downloadSFTPFile(item.path);
                            zip.file(`${file.name}/${item.name}`, fileBuffer as Buffer);
                        }
                    }
                } else {
                    const fileBuffer = await sftpService.downloadSFTPFile(file.path);
                    zip.file(file.name, fileBuffer as Buffer);
                }
            }

            const zipBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE'
            });

            res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipBuffer);
                
        } catch (error) {
            console.error('Error downloading files:', error);
            let message: string = error.message;

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};