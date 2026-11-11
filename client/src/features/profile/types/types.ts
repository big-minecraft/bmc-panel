export interface SshKey {
    id: number;
    name: string;
    keyType: string;
    publicKey: string;
    fingerprint: string;
    createdAt: number;
}

export interface Profile {
    username: string;
    isAdmin: boolean;
    authProvider: string;
    sftp: {
        passwordAuth: boolean;
    };
}
