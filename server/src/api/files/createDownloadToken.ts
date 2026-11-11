import * as path from 'path';
import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import DownloadTokenService from '../../services/downloadTokenService';
import { sendFileError } from './respond';

interface CreateDownloadTokenResponse {
    token: string;
    fileName: string;
}

export const createDownloadTokenEndpoint: ApiEndpoint<unknown, CreateDownloadTokenResponse> = {
    path: '/api/files/download-token',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                files: z.array(z.object({
                    path: z.string().min(1),
                    name: z.string().min(1),
                    type: z.string().optional(),
                })).min(1),
            });

            const { sessionId, files } = schema.parse(req.body) as {
                sessionId: string;
                files: Array<{ path: string; name: string; type?: string }>;
            };

            const single = files.length === 1 && files[0].type !== 'd';
            const fileName = single ? path.posix.basename(files[0].path) : archiveName(files);

            const token = await DownloadTokenService.issue({
                sessionId,
                files: files.map(file => ({ path: file.path, name: file.name })),
                fileName,
                archive: !single,
            });

            res.json({ success: true, data: { token, fileName } });
        } catch (error) {
            sendFileError(res, error, 'Failed to start download');
        }
    },
};

function archiveName(files: Array<{ path: string }>): string {
    if (files.length === 1) return `${path.posix.basename(files[0].path)}.tar.gz`;

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `files-${stamp}.tar.gz`;
}
