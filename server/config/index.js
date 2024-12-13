// server/config/index.js
const { join } = require('path');
const { existsSync, copyFileSync } = require('fs');

const CONFIG_PATH = join(__dirname, '../config.json');
const EXAMPLE_CONFIG_PATH = join(__dirname, '../config.example.json');

const initializeConfig = () => {
    if (!existsSync(EXAMPLE_CONFIG_PATH)) {
        console.error('config.example.json not found. Cannot proceed with configuration setup.');
        process.exit(1);
    }

    if (!existsSync(CONFIG_PATH)) {
        try {
            copyFileSync(EXAMPLE_CONFIG_PATH, CONFIG_PATH);
            console.log('Created config.json from config.example.json');
        } catch (error) {
            console.error('Failed to create config.json:', error.message);
            process.exit(1);
        }
    }

    const config = require(CONFIG_PATH);
    const exampleConfig = require(EXAMPLE_CONFIG_PATH);

    const checkMissingKeys = (example, actual, prefix = '') => {
        Object.keys(example).forEach((key) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof example[key] === 'object' && !Array.isArray(example[key])) {
                if (!actual[key] || typeof actual[key] !== 'object') {
                    console.error(`config.json is missing the key: ${fullKey}. Please check config.example.json`);
                    process.exit(1);
                }
                checkMissingKeys(example[key], actual[key], fullKey);
            } else if (!actual.hasOwnProperty(key)) {
                console.error(`config.json is missing the key: ${fullKey}. Please check config.example.json`);
                process.exit(1);
            }
        });
    };

    const addEnvVariables = () => {
        if (process.env.BMC_PATH) {
            config["bmc-path"] = "/host-root" + process.env.BMC_PATH;
        }

        if (process.env.MARIADB_PASSWORD) {
            config.mariadb.password = process.env.MARIADB_PASSWORD;
        }

        if (process.env.PANEL_HOST) {
            config['panel-host'] = process.env.PANEL_HOST;
        }
    }

    checkMissingKeys(exampleConfig, config);
    addEnvVariables();

    return config;
};

const config = initializeConfig();

module.exports = config;