const express = require('express');
const http = require('http');
const cors = require('cors');
const router = require('./routes');
const { setupWebSocket } = require('./services/websocketService');
const {join} = require("path");
const {existsSync} = require("fs");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use('/', router);

// Setup WebSocket handling
setupWebSocket(server);

server.listen(3001, () => {
    console.log('Server is listening on port 3001');
});

const validateConfig = () => {
    const configPath = join(__dirname, './config.json');
    const exampleConfigPath = join(__dirname, './config.example.json');
    if (!existsSync(configPath)) {
        console.error(
            'config.json not found. Please copy config.example.json to config.json and fill in the required values',
        );
        process.exit(1);
    }

    const config = require(configPath);
    const exampleConfig = require(exampleConfigPath);

    // Function to check for missing keys, including nested keys
    const checkMissingKeys = (example, actual, prefix = '') => {
        Object.keys(example).forEach((key) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof example[key] === 'object' && !Array.isArray(example[key])) {
                if (!actual[key] || typeof actual[key] !== 'object') {
                    console.error(`config.json is missing the key: ${fullKey}. please reference config.example.json`);
                    process.exit(1);
                }
                checkMissingKeys(example[key], actual[key], fullKey);
            } else if (!actual.hasOwnProperty(key)) {
                console.error(`config.json is missing the key: ${fullKey}. please reference config.example.json`);
                process.exit(1);
            }
        });
    };
    checkMissingKeys(exampleConfig, config);
};
validateConfig();