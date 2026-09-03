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

    edge: {
        game: {
            type: 'LoadBalancer' | 'NodePort' | 'ClusterIP';
            annotations?: Record<string, string>;
            loadBalancerIP?: string;
            sourceRanges?: string[];
            java: { port: number };
            bedrock: { enabled: boolean; port: number };
        };
        file: {
            type: 'LoadBalancer' | 'NodePort' | 'ClusterIP';
            annotations?: Record<string, string>;
            sourceRanges?: string[];
        };
    };

    ingress: {
        className: string;
        host: string;
        tls: {
            mode: 'cluster-issuer' | 'existing-secret' | 'none';
            issuer?: string;
            secretName?: string;
        };
    };

    storage: {
        classes: {
            shared: { name: string; accessMode: string };
            database: { name: string; accessMode: string };
        };
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

    metallb?: {
        installResources: boolean;
        ipAddressPool: string[];
        advertisementMode: string;
    };

    redis: {
        host : string;
        port : number;
    };
    mariaDB: {
        external?: boolean;
        host : string;
        port : number;
        username : string;
        initPassword : string;
        database : string;
    };
    mongoDB: {
        external?: boolean;
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
        password: string;
    };
}
