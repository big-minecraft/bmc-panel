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
    }

    public addEnvVariables(): void {
        //These values are required for the application to run both on production and local development
        if (process.env.BMC_PATH) this.config["bmc-path"] = process.env.BMC_PATH;
        if (process.env.MARIADB_PASSWORD) this.config.mariadb.password = process.env.MARIADB_PASSWORD;
        if (process.env.MONGO_INITDB_ROOT_PASSWORD) this.config.mongodb.password = process.env.MONGO_INITDB_ROOT_PASSWORD;
        if (process.env.PANEL_HOST) this.config['panel-host'] = process.env.PANEL_HOST;
        if (process.env.PANEL_SECRET) this.config['panel-secret'] = process.env.PANEL_SECRET;
        if (process.env.K8S_DASHBOARD_HOST) this.config['k8s-dashboard-host'] = process.env.K8S_DASHBOARD_HOST;
        if (process.env.SFTP_PASSWORD) this.config.sftp.password = process.env.SFTP_PASSWORD;
        if (process.env.ENVIRONMENT) this.config.environment = process.env.ENVIRONMENT;

        //These values only need to be modified for local development
        if (process.env.MONGODB_HOST) this.config.mongodb.host = process.env.MONGODB_HOST;
        if (process.env.MONGODB_PORT) this.config.mongodb.port = parseInt(process.env.MONGODB_PORT);
        if (process.env.PROMETHEUS_HOST) this.config.prometheus.host = process.env.PROMETHEUS_HOST;
        if (process.env.PROMETHEUS_PORT) this.config.prometheus.port = parseInt(process.env.PROMETHEUS_PORT);
        if (process.env.SFTP_HOST) this.config.sftp.host = process.env.SFTP_HOST;
        if (process.env.SFTP_PORT) this.config.sftp.port = parseInt(process.env.SFTP_PORT);
        if (process.env.REDIS_HOST) this.config.redis.host = process.env.REDIS_HOST;
        if (process.env.REDIS_PORT) this.config.redis.port = parseInt(process.env.REDIS_PORT);
        if (process.env.MARIADB_HOST) this.config.mariadb.host = process.env.MARIADB_HOST;
        if (process.env.MARIADB_PORT) this.config.mariadb.port = parseInt(process.env.MARIADB_PORT);
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