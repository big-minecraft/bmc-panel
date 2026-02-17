export default interface AppConfig {
    environment : string;

    panel: {
        initialInviteCode: string;
        panelSecret: string;
        storagePath: string;
        panelHost: string;
        inviteCodeExpiryDays: number;
    };

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

    k8s : {
        configPath: string;
    };

    fileEditSession : {
        timeoutMinutes: number;
    };
    sftp: {
        password: string;
    };
}
