import * as path from 'path';
import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import { sendFileError } from './respond';

interface ArchiveRequest {
    sessionId: string;
    files: Array<{ path: string; name: string }>;
    archiveName?: string;
}

interface ArchiveResponse {
    archivePath: string;
    archiveName: string;
}

export const archiveEndpoint: ApiEndpoint<ArchiveRequest, ArchiveResponse> = {
    path: '/api/files/archive',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                files: z.array(z.object({
                    path: z.string().min(1),
                    name: z.string().min(1),
                })).min(1),
                archiveName: z.string().min(1).optional(),
            });

            const { sessionId, files, archiveName } = schema.parse(req.body) as ArchiveRequest;
            const archivePath = await PVCFileOperationsService.getInstance()
                .createArchive(sessionId, files, archiveName);

            res.json({
                success: true,
                data: { archivePath, archiveName: path.posix.basename(archivePath) },
            });
        } catch (error) {
            sendFileError(res, error, 'Failed to create archive');
        }
    },
};
