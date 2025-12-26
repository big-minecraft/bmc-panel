import AppConfig from "../models/appConfig";

let configManager: ConfigManager;

class ConfigManager {
    private readonly config: AppConfig;

    constructor() {
        console.log('Loading configuration...');

        if (!process.env.GLOBAL_VALUES_JSON) {
            console.error('GLOBAL_VALUES_JSON environment variable is required');
            console.error('Please set GLOBAL_VALUES_JSON with your configuration');
            process.exit(1);
        }

        this.config = this.parseGlobalValuesJson();
        console.log('[ConfigManager] Configuration loaded successfully from GLOBAL_VALUES_JSON');
    }

    private parseGlobalValuesJson(): AppConfig {
        try {
            const config: AppConfig = JSON.parse(process.env.GLOBAL_VALUES_JSON!);

            return {
                ...config,
                panel: {
                    initialInviteCode: config.panel.initialInviteCode,
                    storagePath: config.panel.storagePath || '/data',
                    panelHost: config.panel.panelHost || '0.0.0.0',
                    panelSecret: config.panel.panelSecret,
                    k8sDashboardHost: config.panel.k8sDashboardHost || '0.0.0.0',
                    inviteCodeExpiryDays: config.panel.inviteCodeExpiryDays || 7,
                },
                k8s: config.k8s || { configPath: '/etc/rancher/k3s/k3s.yaml' },
                mariaDB: {
                    initPassword: config.mariaDB.initPassword,
                    host: config.mariaDB?.host || 'mariadb-service',
                    port: config.mariaDB?.port || 3306,
                    username: config.mariaDB?.username || 'root',
                    database: config.mariaDB?.database || 'bmc'
                },
                mongoDB: {
                    initPassword: config.mongoDB.initPassword,
                    host: config.mongoDB?.host || 'mongodb-service',
                    port: config.mongoDB?.port || 27017,
                    username: config.mongoDB?.username || 'admin',
                    database: config.mongoDB?.database || 'admin'
                },
                prometheus: config.prometheus || { host: 'prometheus-service', port: 9090 }
            };
        } catch (error) {
            console.error('[ConfigManager] Failed to parse GLOBAL_VALUES_JSON:', error);
            console.error('Please ensure GLOBAL_VALUES_JSON is valid JSON');
            process.exit(1);
        }
    }

    public static getConfig(): AppConfig {
        return configManager.config;
    }

    public static init() {
        configManager = new ConfigManager();
    }
}

export default ConfigManager;
