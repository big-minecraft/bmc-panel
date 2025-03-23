import WebSocket from 'ws';
import {handlePodConnection} from './podService';

function setupWebSocket(server) {
    const wss = new WebSocket.Server({noServer: true});

    server.on('upgrade', (request, socket, head) => {
        // temporary patch to prevent socket.io websocket requests from interfering with legacy system
        if (request.url.includes('socket.io')) return;

        console.log('Upgrade request received:', request.url);

        const urlParts = request.url.split('/');
        const podName = urlParts[urlParts.length - 1];

        const deployment = urlParts[urlParts.length - 2];

        if (!podName || !deployment) {
            console.error("Incorrect details specified in URL");
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            console.log(`WebSocket connection established for pod: ${podName}`);
            wss.emit('connection', ws, request, deployment, podName);
        });
    });

    wss.on('connection', handlePodConnection);
}

export {
    setupWebSocket
};