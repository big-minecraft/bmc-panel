import WebSocket from 'ws';
import {handlePodConnection} from './podService';

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        console.log('Upgrade request received:', request.url);

        const urlParts = request.url.split('/');
        const podName = urlParts[urlParts.length - 1];

        if (!podName) {
            console.error("No pod name specified in URL");
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            console.log(`WebSocket connection established for pod: ${podName}`);
            wss.emit('connection', ws, request, podName);
        });
    });

    wss.on('connection', handlePodConnection);
}

export {
    setupWebSocket
};