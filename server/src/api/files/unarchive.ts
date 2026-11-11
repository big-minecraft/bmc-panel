import * as path from 'path';
import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import { sendFileError } from './respond';

interface UnarchiveFileRequest {
    sessionId: string;
    archivePath: string;
}

interface UnarchiveFileResponse {
    destination: string;
    destinationName: string;
}

export const unarchiveFileEndpoint: ApiEndpoint<UnarchiveFileRequest, UnarchiveFileResponse> = {
    path: '/api/files/unarchive',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                archivePath: z.string().min(1),
            });

            const { sessionId, archivePath } = schema.parse(req.body);
            const destination = await PVCFileOperationsService.getInstance()
                .extractArchive(sessionId, archivePath);

            res.json({
                success: true,
                data: { destination, destinationName: path.posix.basename(destination) },
            });
        } catch (error) {
            sendFileError(res, error, 'Failed to extract archive');
        }
    },
};
