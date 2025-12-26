export interface PulumiStackConfig {
    projectName: string;
    stackName: string;
    statePath: string;
    passphrase: string;
}

export interface DeploymentResult {
    success: boolean;
    summary?: {
        created: number;
        updated: number;
        deleted: number;
        unchanged: number;
    };
    error?: Error;
}
