// server/config/index.js
const { join } = require('path');
const { existsSync, copyFileSync } = require('fs');

const CONFIG_PATH = join(__dirname, '../config.json');
const EXAMPLE_CONFIG_PATH = join(__dirname, '../config.example.json');

// Initialize config synchronously before anything else
const initializeConfig = () => {
    // Check if example config exists first
    if (!existsSync(EXAMPLE_CONFIG_PATH)) {
        console.error('config.example.json not found. Cannot proceed with configuration setup.');
        process.exit(1);
    }

    // If config doesn't exist, copy the example
    if (!existsSync(CONFIG_PATH)) {
        try {
            copyFileSync(EXAMPLE_CONFIG_PATH, CONFIG_PATH);
            console.log('Created config.json from config.example.json. Please fill in the required values.');
            process.exit(1);
        } catch (error) {
            console.error('Failed to create config.json:', error.message);
            process.exit(1);
        }
    }

    // Load and validate config
    const config = require(CONFIG_PATH);
    const exampleConfig = require(EXAMPLE_CONFIG_PATH);

    // Function to check for missing keys, including nested keys
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

    checkMissingKeys(exampleConfig, config);
    return config;
};

// Initialize config immediately
const config = initializeConfig();

// Export the config object directly
module.exports = config;