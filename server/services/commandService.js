const WebSocket = require('ws');
const { Agent } = require("https");
const fs = require('fs');
const path = require('path');

async function executeCommand(ws, command, podName, cluster, user) {
    if (!podName) {
        throw new Error('Pod name is required');
    }

    const execUrl = `${cluster.server}/api/v1/namespaces/default/pods/${podName}/exec?container=mc`;
    const params = new URLSearchParams();

    params.append('command', 'bash');
    params.append('command', '-c');

    const escapedCommand = command.replace(/'/g, "'\\''");
    const finalCommand = `echo '${escapedCommand}' > /tmp/server_input`;

    console.log('Transformed command:', finalCommand);

    params.append('command', finalCommand);
    params.append('stdin', 'true');
    params.append('stdout', 'true');
    params.append('stderr', 'true');
    params.append('tty', 'true');

    const fullUrl = `${execUrl}?${params.toString()}`;
    console.log('Executing command with URL:', fullUrl);

    // Read token and CA cert from files with host-root prefix
    const tokenPath = path.join('/host-root', user.authProvider.config.tokenFile);
    const caPath = path.join('/host-root', cluster.caFile);

    const token = fs.readFileSync(tokenPath, 'utf8');
    const ca = fs.readFileSync(caPath);

    // Convert http URLs to WebSocket URLs
    const wsUrl = fullUrl.replace(/^http/, 'ws');

    // Create WebSocket connection with token auth
    const execWs = new WebSocket(wsUrl, 'v4.channel.k8s.io', {
        agent: new Agent({
            ca: ca,
            rejectUnauthorized: !cluster.skipTLSVerify
        }),
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    execWs.on('open', () => {
        console.log('Exec WebSocket opened');
    });

    execWs.on('close', () => {
        console.log('Exec WebSocket closed');
    });

    execWs.on('message', (data) => {
        const channel = data[0];
        const message = data.slice(1).toString();

        if (channel === 1) {
            console.log('Exec stdout:', message);
            if (ws.readyState === ws.OPEN) {
                ws.send(message);
            }
        } else if (channel === 2) {
            console.log('Exec stderr:', message);
            if (ws.readyState === ws.OPEN) {
                ws.send(`Error: ${message}`);
            }
        }
    });

    execWs.on('error', (error) => {
        console.error('Exec WebSocket error:', error);
        if (ws.readyState === ws.OPEN) {
            ws.send(`Error: ${error.message}`);
            ws.close();
        }
    });
}

module.exports = {
    executeCommand
};