const express = require('express');
const http = require('http');
const cors = require('cors');
const router = require('./routes');
const { setupWebSocket } = require('./services/websocketService');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use('/', router);

// Setup WebSocket handling
setupWebSocket(server);

server.listen(3001, () => {
    console.log('Server is listening on port 3001');
});