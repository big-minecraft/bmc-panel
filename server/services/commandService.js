const WebSocket = require('ws');
const { Agent } = require("https");
const fs = require('fs');
const path = require('path');
const kubernetesClient = require('../controllers/k8s');

async function executeCommand(ws, command, podName, cluster, user) {
    if (!podName) {
        throw new Error('Pod name is required');
    }

    const execUrl = `${cluster.server}/api/v1/namespaces/default/pods/${podName}/exec`;
    const params = new URLSearchParams();
    params.append('container', 'mc');
    params.append('command', 'bash');
    params.append('command', '-c');

    const escapedCommand = command.replace(/'/g, "'\\''");
    const finalCommand = `echo '${escapedCommand}' > /tmp/server_input`;

    console.log('transformed command:', finalCommand);

    params.append('command', finalCommand);
    params.append('stdin', 'true');
    params.append('stdout', 'true');
    params.append('stderr', 'true');
    params.append('tty', 'true');

    const fullUrl = `${execUrl}?${params.toString()}`;
    console.log('executing command with url:', fullUrl);

    // Convert http URLs to WebSocket URLs
    const wsUrl = fullUrl.replace(/^http/, 'ws');

    // Set up WebSocket options based on environment
    const wsOptions = {
        protocol: 'v4.channel.k8s.io'
    };

    if (kubernetesClient.isRunningInCluster()) {
        // Production environment setup
        console.log('running in cluster environment');
        const tokenPath = path.join('/host-root', user.authProvider.config.tokenFile);
        const caPath = path.join('/host-root', cluster.caFile);

        const token = fs.readFileSync(tokenPath, 'utf8');
        const ca = fs.readFileSync(caPath);

        wsOptions.agent = new Agent({
            ca: ca,
            rejectUnauthorized: !cluster.skipTLSVerify
        });
        wsOptions.headers = {
            'Authorization': `Bearer ${token}`
        };
    } else {
        // Development environment setup
        console.log('running in development environment');
        const cert = Buffer.from(user.certData, 'base64');
        const key = Buffer.from(user.keyData, 'base64');
        const ca = cluster.caData ? Buffer.from(cluster.caData, 'base64') : undefined;

        wsOptions.agent = new Agent({
            cert: cert,
            key: key,
            ca: ca,
            rejectUnauthorized: false
        });
    }

    console.log('creating websocket connection with options:', {
        url: wsUrl,
        hasAgent: !!wsOptions.agent,
        hasToken: !!wsOptions.headers?.Authorization,
        hasCert: !!wsOptions.agent?.options?.cert,
        hasKey: !!wsOptions.agent?.options?.key,
        hasCa: !!wsOptions.agent?.options?.ca
    });

    // Create WebSocket connection
    const execWs = new WebSocket(wsUrl, wsOptions);

    execWs.on('open', () => {
        console.log('exec websocket opened');
    });

    execWs.on('close', () => {
        console.log('exec websocket closed');
    });

    execWs.on('message', (data) => {
        const channel = data[0];
        const message = data.slice(1).toString();

        if (channel === 1) {
            console.log('exec stdout:', message);
            if (ws.readyState === ws.OPEN) {
                ws.send(message);
            }
        } else if (channel === 2) {
            console.log('exec stderr:', message);
            if (ws.readyState === ws.OPEN) {
                ws.send(`Error: ${message}`);
            }
        }
    });

    execWs.on('error', (error) => {
        console.error('exec websocket error:', error);
        if (ws.readyState === ws.OPEN) {
            ws.send(`Error: ${error.message}`);
            ws.close();
        }
    });

    // Handle client WebSocket close
    ws.on('close', () => {
        console.log('client websocket closed, terminating exec connection');
        if (execWs.readyState === WebSocket.OPEN) {
            execWs.close();
        }
    });
}

module.exports = {
    executeCommand
};