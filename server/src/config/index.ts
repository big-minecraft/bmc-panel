import {join} from 'path';
import {existsSync, copyFileSync} from 'fs';
import AppConfig from "./appConfig";
import '../../config.example.json';
// import '../../config.json';

// const CONFIG_PATH = join(__dirname, '../../config.json');
const EXAMPLE_CONFIG_PATH = join(__dirname, '../../config.example.json');

const validateConfig = (config: AppConfig): void => {
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

    // //validate if the kubeconfig file exists
    // if (!existsSync(config.k8s.configPath)) {
    //     throw new Error('Kubeconfig file does not exist');
    // }
    //
    // //validate if the bmc path exists
    // if (!existsSync(config["bmc-path"])) {
    //     throw new Error('BMC path does not exist');
    // }
};

const initializeConfig = (): AppConfig => {
    console.log("Initializing config");
    console.log("Initializing config");
    console.log("Initializing config");
    console.log("Initializing config");
    console.log("Initializing config");
    console.log("Initializing config");
    if (!existsSync(EXAMPLE_CONFIG_PATH)) {
        console.error('config.example.json not found. Cannot proceed with configuration setup.');
        process.exit(1);
    }

    // if (!existsSync(CONFIG_PATH)) {
    //     try {
    //         copyFileSync(EXAMPLE_CONFIG_PATH, CONFIG_PATH);
    //         console.log('Created config.json from config.example.json');
    //     } catch (error) {
    //         console.error('Failed to create config.json:', error instanceof Error ? error.message : 'Unknown error');
    //         process.exit(1);
    //     }
    // }

    let config: AppConfig = require(EXAMPLE_CONFIG_PATH) as AppConfig;
    // let exampleConfig: AppConfig;

    // try {
    //     config = require(CONFIG_PATH) as AppConfig;
    //     exampleConfig = require(EXAMPLE_CONFIG_PATH) as AppConfig;
    // } catch (error) {
    //     console.error('Failed to load configuration files:', error instanceof Error ? error.message : 'Unknown error');
    //     process.exit(1);
    // }

    // const checkMissingKeys = (example: Record<string, unknown>, actual: Record<string, unknown>, prefix = ''): void => {
    //     Object.keys(example).forEach((key) => {
    //         const fullKey = prefix ? `${prefix}.${key}` : key;
    //         if (typeof example[key] === 'object' && !Array.isArray(example[key])) {
    //             if (!actual[key] || typeof actual[key] !== 'object') {
    //                 console.error(`config.json is missing the key: ${fullKey}. Please check config.example.json`);
    //                 process.exit(1);
    //             }
    //             checkMissingKeys(
    //                 example[key] as Record<string, unknown>,
    //                 actual[key] as Record<string, unknown>,
    //                 fullKey
    //             );
    //         } else if (!Object.prototype.hasOwnProperty.call(actual, key)) {
    //             console.error(`config.json is missing the key: ${fullKey}. Please check config.example.json`);
    //             process.exit(1);
    //         }
    //     });
    // };

    const addEnvVariables = (): void => {
        if (process.env.BMC_PATH) config["bmc-path"] = "/host-root" + process.env.BMC_PATH;
        if (process.env.MARIADB_PASSWORD) config.mariadb.password = process.env.MARIADB_PASSWORD;
        if (process.env.MONGO_INITDB_ROOT_PASSWORD) config.mongodb.password = process.env.MONGO_INITDB_ROOT_PASSWORD;
        if (process.env.PANEL_HOST) config['panel-host'] = process.env.PANEL_HOST;
        if (process.env.K8S_DASHBOARD_HOST) config['k8s-dashboard-host'] = process.env.K8S_DASHBOARD_HOST;
        if (process.env.TOKEN_SECRET) config['token-secret'] = process.env.TOKEN_SECRET;
        if (process.env.REDIS_HOST) config.redis.host = process.env.REDIS_HOST;
        if (process.env.SFTP_PASSWORD) config.sftp.password = process.env.SFTP_PASSWORD;
        if (process.env.ENVIRONMENT) config.environment = process.env.ENVIRONMENT;
    };

    // checkMissingKeys(exampleConfig, config);
    addEnvVariables();

    console.log("-----------------");
    console.log(config);
    console.log("-----------------");

    try {
        validateConfig(config);
    } catch (error) {
        console.error('Configuration validation failed:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }

    return config;
};

const config: AppConfig = initializeConfig();

export default config;
