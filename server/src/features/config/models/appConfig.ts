export default interface AppConfig {
    environment : string;
    namespace: string;

    certManager?: {
        clusterIssuerName: string;
        email: string;
        installClusterIssuer: boolean;
    };

    panel: {
        initialInviteCode: string;
        panelSecret: string;
        storagePath: string;
        panelHost: string;
        inviteCodeExpiryDays: number;
    };

    loadBalancer: {
        provider: string;
        metallb?: {
            advertisementMode: string;
            entrypointIP: string;
            installResources: boolean;
            ipAddressPool: string[];
        };
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
        host : string;
        port : number;
    };
    mariaDB: {
        host : string;
        port : number;
        username : string;
        initPassword : string;
        database : string;
    };
    mongoDB: {
        host : string;
        port : number;
        username : string;
        initPassword: string;
        database : string;
    };
    prometheus : {
        host: string;
        port: number;
    };

    fileEditSession : {
        timeoutMinutes: number;
    };
    sftp: {
        enabled?: boolean;
        pass?: boolean;
        password: string;
    };
}
