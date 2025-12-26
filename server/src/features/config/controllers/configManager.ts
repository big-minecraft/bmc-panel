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

            return config;
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
