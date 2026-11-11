import { ApiEndpoint, AuthType } from '../types';
import { z } from 'zod';
import DatabaseService, { SshKeyConflictError } from '../../services/databaseService';
import { MAX_PUBLIC_KEY_LENGTH, SshKeyError, parsePublicKey } from '../../misc/sshKeys';
import { SshKey, requireUser, toSshKey } from './types';

const addSshKeySchema = z.object({
    name: z.string().trim().max(255).optional(),
    publicKey: z.string().min(1).max(MAX_PUBLIC_KEY_LENGTH),
}).strict();

export type AddSshKeyRequest = z.infer<typeof addSshKeySchema>;

export interface AddSshKeyResponse {
    key: SshKey;
}

export const addSshKeyEndpoint: ApiEndpoint<AddSshKeyRequest, AddSshKeyResponse> = {
    path: '/api/profile/ssh-keys',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const user = await requireUser(req);
            const data = addSshKeySchema.parse(req.body);
            const parsed = parsePublicKey(data.publicKey);

            const name = data.name?.trim() || parsed.comment || parsed.type;

            const record = await DatabaseService.getInstance().addSshKey(
                user.id,
                name,
                parsed.type,
                parsed.publicKey,
                parsed.fingerprint
            );

            res.json({
                success: true,
                data: {
                    key: toSshKey(record),
                },
            });
        } catch (error) {
            console.error('Failed to add ssh key:', error);

            if (error instanceof SshKeyError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
                return;
            }

            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request',
                });
                return;
            }

            if (error instanceof SshKeyConflictError) {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
                return;
            }

            res.status(500).json({
                success: false,
                error: 'Failed to add SSH key',
            });
        }
    },
};
