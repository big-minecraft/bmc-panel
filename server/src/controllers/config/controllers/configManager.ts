import {join} from "path";
import AppConfig from "../models/appConfig";
import {existsSync} from "fs";

let configManager: ConfigManager;

const EXAMPLE_CONFIG_PATH = join(__dirname, '../../../../config.example.json');


class ConfigManager {
    private readonly config: AppConfig;

    constructor() {
        console.log('Loading configuration...');
        if (!existsSync(EXAMPLE_CONFIG_PATH)) {
            console.error('config.example.json not found. Cannot proceed with configuration setup.');
            process.exit(1);
        }

        this.config = require(EXAMPLE_CONFIG_PATH) as AppConfig;

        this.addEnvVariables();

        try {
            this.validateConfig(this.config);
        } catch (error) {
            console.error('Configuration validation failed:', error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    }

    public addEnvVariables(): void {
        if (process.env.BMC_PATH) this.config["bmc-path"] = process.env.BMC_PATH;
        if (process.env.MARIADB_HOST) this.config.mariadb.host = process.env.MARIADB_HOST;
        if (process.env.MARIADB_PORT) this.config.mariadb.port = parseInt(process.env.MARIADB_PORT);
        if (process.env.MARIADB_PASSWORD) this.config.mariadb.password = process.env.MARIADB_PASSWORD;
        if (process.env.MONGO_INITDB_ROOT_PASSWORD) this.config.mongodb.password = process.env.MONGO_INITDB_ROOT_PASSWORD;
        if (process.env.PANEL_HOST) this.config['panel-host'] = process.env.PANEL_HOST;
        if (process.env.K8S_DASHBOARD_HOST) this.config['k8s-dashboard-host'] = process.env.K8S_DASHBOARD_HOST;
        if (process.env.TOKEN_SECRET) this.config['token-secret'] = process.env.TOKEN_SECRET;
        if (process.env.REDIS_HOST) this.config.redis.host = process.env.REDIS_HOST;
        if (process.env.REDIS_PORT) this.config.redis.port = parseInt(process.env.REDIS_PORT);
        if (process.env.SFTP_PASSWORD) this.config.sftp.password = process.env.SFTP_PASSWORD;
        if (process.env.ENVIRONMENT) this.config.environment = process.env.ENVIRONMENT;
    };

    public validateConfig(config: AppConfig): void  {
        // Validate required string fields
        const requiredStrings: Array<keyof AppConfig> = ['panel-host', 'k8s-dashboard-host', 'bmc-path', 'token-secret'];
        requiredStrings.forEach(key => {
            if (typeof config[key] !== 'string' || !config[key]) {
                throw new Error(`Configuration error: ${key} must be a non-empty string`);
            }
        });

        // Validate required numbers
        const requiredNumbers: Array<keyof AppConfig> = ['invite-code-expiry-days', 'max-upload-size-mb'];
        requiredNumbers.forEach(key => {
            if (typeof config[key] !== 'number' || config[key] <= 0) {
                throw new Error(`Configuration error: ${key} must be a positive number`);
            }
        });

        // Validate Redis configuration
        if (!config.redis || typeof config.redis.host !== 'string' || typeof config.redis.port !== 'number') {
            throw new Error('Invalid Redis configuration');
        }

        // Validate Kubernetes configuration
        if (!config.k8s || typeof config.k8s.configPath !== 'string') {
            throw new Error('Invalid Kubernetes configuration');
        }

        // Validate MariaDB configuration
        const mariadb = config.mariadb;
        if (!mariadb ||
            typeof mariadb.host !== 'string' ||
            typeof mariadb.port !== 'number' ||
            typeof mariadb.username !== 'string' ||
            typeof mariadb.password !== 'string' ||
            typeof mariadb.database !== 'string') {
            throw new Error('Invalid MariaDB configuration');
        }

        // Validate MongoDB configuration
        const mongodb = config.mongodb;
        if (!mongodb ||
            typeof mongodb.host !== 'string' ||
            typeof mongodb.port !== 'number' ||
            typeof mongodb.username !== 'string' ||
            typeof mongodb.password !== 'string' ||
            typeof mongodb.database !== 'string') {
            throw new Error('Invalid MongoDB configuration');
        }

        // Validate SFTP configuration
        const sftp = config.sftp;
        if (!sftp ||
            typeof sftp.host !== 'string' ||
            typeof sftp.port !== 'number' ||
            typeof sftp.username !== 'string' ||
            typeof sftp.password !== 'string') {
            throw new Error('Invalid SFTP configuration');
        }

        // Validate Prometheus configuration
        if (!config.prometheus ||
            typeof config.prometheus.host !== 'string' ||
            typeof config.prometheus.port !== 'number') {
            throw new Error('Invalid Prometheus configuration');
        }
    };

    public static getConfig() {
        return configManager.config;
    }

    public static get(key: keyof AppConfig) {
        return configManager.config[key];
    }

    public static getString(key: keyof AppConfig) {
        return configManager.config[key] as string;
    }

    public static getInt(key: keyof AppConfig) {
        return configManager.config[key] as number;
    }

    public static init() {
        configManager = new ConfigManager();
    }
}

export default ConfigManager;