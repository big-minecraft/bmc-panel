import DatabaseService, { SshKeyRecord } from '../../services/databaseService';
import { ApiRequest } from '../types';

export interface SshKey {
    id: number;
    name: string;
    keyType: string;
    publicKey: string;
    fingerprint: string;
    createdAt: number;
}

export const toSshKey = (record: SshKeyRecord): SshKey => ({
    id: Number(record.id),
    name: record.name,
    keyType: record.key_type,
    publicKey: record.public_key,
    fingerprint: record.fingerprint,
    createdAt: new Date(record.created_at).getTime(),
});

export const requireUser = async (req: ApiRequest<unknown>): Promise<any> => {
    const username = req.user?.username;
    if (!username) throw new Error('Not signed in');

    const user = await DatabaseService.getInstance().getUser(username);
    if (!user) throw new Error('User not found');

    return user;
};
