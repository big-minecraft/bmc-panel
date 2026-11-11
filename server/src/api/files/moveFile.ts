import { z } from 'zod';
import { ApiEndpoint, AuthType } from '../types';
import PVCFileOperationsService from '../../services/pvcFileOperationsService';
import { sendFileError } from './respond';

interface MoveFilesRequest {
    sessionId: string;
    moves: Array<{ sourcePath: string; destinationPath: string }>;
}

interface MoveFilesResponse {
    moved: number;
}

export const moveFileEndpoint: ApiEndpoint<MoveFilesRequest, MoveFilesResponse> = {
    path: '/api/files/move',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const schema = z.object({
                sessionId: z.string().uuid(),
                moves: z.array(z.object({
                    sourcePath: z.string().min(1),
                    destinationPath: z.string().min(1),
                })).min(1),
            });

            const { sessionId, moves } = schema.parse(req.body);
            const files = PVCFileOperationsService.getInstance();

            for (const move of moves) {
                await files.movePath(sessionId, move.sourcePath, move.destinationPath);
            }

            res.json({ success: true, data: { moved: moves.length } });
        } catch (error) {
            sendFileError(res, error, 'Failed to move');
        }
    },
};
