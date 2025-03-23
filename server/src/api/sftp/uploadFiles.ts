import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import multer from 'multer';
import ConfigManager from "../../features/config/controllers/configManager";
import SftpService from "../../services/sftpService";

const fileSchema = z.object({
    buffer: z.instanceof(Buffer),
    originalname: z.string().min(1, { message: "Original file name must not be empty" }),
}).strict();

const uploadMultipleSchema = z.object({
    path: z.string()
}).strict();

export type FileSchema = z.infer<typeof fileSchema>;
export type UploadMultipleRequest = z.infer<typeof uploadMultipleSchema>;

export interface UploadMultipleResponse {
    success: boolean;
    data?: {
        message: string;
    };
    error?: string;
}

export const uploadMultipleEndpoint: ApiEndpoint<UploadMultipleRequest, UploadMultipleResponse> = {
    path: '/api/sftp/upload',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const storage = multer.memoryStorage();
            const upload = multer({
                storage: storage
            }).array('files');

            await new Promise<void>((resolve, reject) => {
                upload(req, res, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                throw new Error('No files specified for upload');
            }

            const files = (req.files).map(file => ({
                buffer: file.buffer,
                originalname: file.originalname
            }));

            const validatedData = uploadMultipleSchema.parse({
                path: req.body.path
            });

            await SftpService.getInstance().uploadSFTPFiles(files, validatedData.path);

            res.json({
                success: true,
                data: {
                    success: true,
                    data: {
                        message: 'Files uploaded successfully',
                    }
                }
            });

        } catch (error) {
            console.error('Error uploading files:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to upload files'
            });
        }
    }
};