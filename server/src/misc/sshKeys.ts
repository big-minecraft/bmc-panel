import { createHash } from 'crypto';

const SUPPORTED_KEY_TYPES = [
    'ssh-ed25519',
    'ssh-rsa',
    'ecdsa-sha2-nistp256',
    'ecdsa-sha2-nistp384',
    'ecdsa-sha2-nistp521',
    'sk-ssh-ed25519@openssh.com',
    'sk-ecdsa-sha2-nistp256@openssh.com',
] as const;

export const MAX_PUBLIC_KEY_LENGTH = 16 * 1024;

export interface ParsedPublicKey {
    type: string;
    publicKey: string;
    comment: string | null;
    fingerprint: string;
}

export class SshKeyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SshKeyError';
    }
}

/**
 * Reads the next SSH wire-format string (4 byte big-endian length, then bytes)
 * out of a decoded key blob.
 */
const readWireString = (blob: Buffer, offset: number): { value: Buffer; next: number } => {
    if (offset + 4 > blob.length) throw new SshKeyError('Public key is malformed');

    const length = blob.readUInt32BE(offset);
    const start = offset + 4;
    const end = start + length;

    if (length > blob.length || end > blob.length) throw new SshKeyError('Public key is malformed');

    return { value: blob.subarray(start, end), next: end };
};

/**
 * Validates an OpenSSH public key line and derives its fingerprint.
 *
 * A key is only accepted when the type named in the text matches the type
 * encoded inside the base64 blob, so a key cannot claim to be something it is
 * not on its way into authorized_keys.
 */
export const parsePublicKey = (input: string): ParsedPublicKey => {
    const trimmed = (input || '').trim();

    if (!trimmed) throw new SshKeyError('Public key is empty');
    if (trimmed.length > MAX_PUBLIC_KEY_LENGTH) throw new SshKeyError('Public key is too large');
    if (/[\r\n]/.test(trimmed)) throw new SshKeyError('Paste a single public key, not a file of them');

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) throw new SshKeyError('Expected a key in the form "<type> <key> [comment]"');

    const [type, encoded, ...commentParts] = parts;

    if (!(SUPPORTED_KEY_TYPES as readonly string[]).includes(type)) {
        if (type === 'ssh-dss') {
            throw new SshKeyError('DSA keys are not supported; use an Ed25519 or RSA key');
        }
        if (type.startsWith('-----')) {
            throw new SshKeyError('That is a private key. Paste the matching .pub file instead');
        }
        throw new SshKeyError(`Unsupported key type "${type}"`);
    }

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
        throw new SshKeyError('Public key is not valid base64');
    }

    const blob = Buffer.from(encoded, 'base64');
    if (blob.length === 0) throw new SshKeyError('Public key is not valid base64');

    // Re-encoding catches base64 that decodes but was not canonical, which
    // would otherwise produce a fingerprint that disagrees with ssh-keygen.
    if (blob.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) {
        throw new SshKeyError('Public key is not valid base64');
    }

    const { value: declaredType } = readWireString(blob, 0);
    if (declaredType.toString('utf8') !== type) {
        throw new SshKeyError('Public key type does not match its contents');
    }

    const comment = commentParts.join(' ').trim();

    return {
        type,
        publicKey: `${type} ${encoded}`,
        comment: comment || null,
        fingerprint: `SHA256:${createHash('sha256').update(blob).digest('base64').replace(/=+$/, '')}`,
    };
};

export const SUPPORTED_SSH_KEY_TYPES: readonly string[] = SUPPORTED_KEY_TYPES;