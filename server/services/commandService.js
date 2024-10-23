const WebSocket = require('ws');
const { Agent } = require("https");

async function executeCommand(ws, command, podName, cluster, user) {
    const execUrl = `${cluster.server}/api/v1/namespaces/default/pods/${podName}/exec`;
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

    const agent = new Agent({
        cert: Buffer.from(user.certData, 'base64'),
        key: Buffer.from(user.keyData, 'base64'),
        rejectUnauthorized: false
    });

    const execWs = new WebSocket(fullUrl, 'v4.channel.k8s.io', { agent });

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
            ws.send(message);
        } else if (channel === 2) {
            console.log('Exec stderr:', message);
            ws.send(`Error: ${message}`);
        }
    });

    execWs.on('error', (error) => {
        console.error('Exec WebSocket error:', error);
        ws.send(`Error: ${error.message}`);
    });
}

module.exports = {
    executeCommand
};