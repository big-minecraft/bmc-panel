interface RedisConfig {
    host: string;
    port: number;
}

interface KubernetesConfig {
    configPath: string;
}

interface MariaDBConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}

interface MongoDBConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}

interface PrometheusConfig {
    host: string;
    port: number;
}

interface FileEditSessionConfig {
    timeoutMinutes: number;
    maxSessionsPerDeployment: number;
    maxSessionsPerUser: number;
    podImage: string;
    podNamespace: string;
}

export default interface AppConfig extends Record<string, unknown> {
    'environment': string;
    'panel-host': string;
    'panel-secret': string;
    'k8s-dashboard-host': string;
    'storage-path': string;
    'token-secret': string;
    'invite-code-expiry-days': number;
    redis: RedisConfig;
    k8s: KubernetesConfig;
    mariadb: MariaDBConfig;
    mongodb: MongoDBConfig;
    prometheus: PrometheusConfig;
    fileEditSession?: FileEditSessionConfig;
}