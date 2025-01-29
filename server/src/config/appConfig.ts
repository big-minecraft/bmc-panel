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

interface SFTPConfig {
    host: string;
    port: number;
    username: string;
    password: string;
}

interface PrometheusConfig {
    host: string;
    port: number;
}

export default interface AppConfig extends Record<string, unknown> {
    'environment': string;
    'panel-host': string;
    'bmc-path': string;
    'token-secret': string;
    'invite-code-expiry-days': number;
    'max-upload-size-mb': number;
    redis: RedisConfig;
    k8s: KubernetesConfig;
    mariadb: MariaDBConfig;
    mongodb: MongoDBConfig;
    sftp: SFTPConfig;
    prometheus: PrometheusConfig;
}