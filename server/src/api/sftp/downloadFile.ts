import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import SFTPClient from "../../services/sftpService";
import path from 'path';
import {hasValidBasicAuth} from "../../middleware/auth";

const downloadFileSchema = z.object({
    path: z.string().min(1),
    token: z.string(),
}).strict();

export type DownloadFileRequest = z.infer<typeof downloadFileSchema>;

export const downloadFileEndpoint: ApiEndpoint<DownloadFileRequest> = {
    path: '/api/sftp/download',
    method: 'get',
    auth: AuthType.None,
    handler: async (req, res) => {
        let token = req.query.token;
        if (!token) {
            res.status(400).json({
                success: false,
                // message: 'Token is required'
            });
            return;
        }
        if (!hasValidBasicAuth(token as string)) {
            res.status(401).json({
                success: false,
                // message: 'Invalid token'
            });
            return;
        }

        let releaseClient = null;

        try {
            // Parse and validate query parameters
            const { path: filePath } = downloadFileSchema.parse(req.query);

            // Get SFTPClient instance
            const sftpClient = SFTPClient.getInstance();

            // Get filename from path
            const fileName = path.basename(filePath);

            // Set proper headers for direct browser download
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            // Create a read stream from the SFTP file
            const { stream, release } = await sftpClient.createSFTPReadStream(filePath);
            releaseClient = release;

            // Set up error handling
            stream.on('error', (error) => {
                console.error('stream error:', error);
                if (!res.headersSent) {
                    // res.status(500).json({ success: false, message: 'Stream error' });
                } else {
                    res.end();
                }
                if (releaseClient) releaseClient();
            });

            // Handle client disconnect
            res.on('close', () => {
                if (releaseClient) releaseClient();
            });

            // Pipe the stream directly to the response
            stream.pipe(res);

        } catch (error) {
            if (releaseClient) releaseClient();

            console.error('error setting up download stream:', error);

            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    // message: 'Invalid request parameters',
                    // details: error.errors
                });
            } else {
                res.status(500).json({
                    success: false,
                    // message: 'Failed to download file'
                });
            }
        }
    }
};