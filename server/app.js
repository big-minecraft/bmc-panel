const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config'); // This will initialize the config
const router = require('./routes');
const { setupWebSocket } = require('./services/websocketService');
const { databaseInit } = require('./controllers/database');
const { authInit } = require('./controllers/authentication');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use('/', router);

// Setup WebSocket handling
setupWebSocket(server);

// Initialize other services
databaseInit();
authInit();

server.listen(3001, () => {
    console.log('Server is listening on port 3001');
});