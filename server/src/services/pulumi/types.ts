export interface GlobalValues {
    environment: string;
    initialInviteCode: string;
    panelSecret: string;
    loadBalancer: {
        type: string;
        entrypointIP?: string;
    };
    ingress: {
        ingressClass: string;
        panelDomain: string;
    };
    storage: {
        storageClass: string;
        reclaimPolicy: string;
        volumeSize: {
            persistent: string;
            scalable: string;
            proxy: string;
            process: string;
            manifests: string;
            mariaDB: string;
            mongoDB: string;
        };
    };
    redis: {
        host: string;
        port: number;
    };
    mariaDB: {
        initPassword: string;
    };
    mongoDB: {
        initPassword: string;
    };
}

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
