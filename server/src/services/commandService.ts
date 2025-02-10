import WebSocket from 'ws';
import {Agent} from 'https';
import * as fs from 'fs';
import * as path from 'path';
import kubernetesService from "./kubernetesService";

interface Cluster {
    server: string;
    caFile?: string;
    caData?: string;
    skipTLSVerify?: boolean;
}

interface User {
    authProvider?: {
        config: {
            tokenFile: string;
        };
    };
    certData?: string;
    keyData?: string;
}

interface WebSocketOptions {
    agent: Agent;
    headers: {
        Authorization?: string;
        [key: string]: string | undefined;
    };
}

function constructFinalCommand(command: string): string {
    const escapedCommand = command.replace(/'/g, "'\\''");
    return `echo '${escapedCommand}' > /tmp/server_input`;
}

async function executeCommand(
    ws: WebSocket,
    command: string,
    podName: string,
    cluster: Cluster,
    user: User,
    containerCommand: boolean
): Promise<void> {
    if (!podName) {
        throw new Error('Pod name is required');
    }

    const execUrl = `${cluster.server}/api/v1/namespaces/default/pods/${podName}/exec`;
    const params = new URLSearchParams();
    params.append('container', 'mc');
    params.append('command', 'bash');
    params.append('command', '-c');

    const finalCommand = containerCommand ? constructFinalCommand(command) : command;
    console.log('transformed command:', finalCommand);
    params.append('command', finalCommand);
    params.append('stdin', 'true');
    params.append('stdout', 'true');
    params.append('stderr', 'true');
    params.append('tty', 'true');

    const fullUrl = `${execUrl}?${params.toString()}`;
    console.log('executing command with url:', fullUrl);

    const wsUrl = fullUrl.replace(/^http/, 'ws');

    const wsOptions = await createWebSocketConnection(wsUrl, cluster, user);

    const execWs = new WebSocket(wsUrl, 'v4.channel.k8s.io', wsOptions);

    execWs.on('open', () => {
        console.log('exec websocket opened');
    });

    execWs.on('close', () => {
        console.log('exec websocket closed');
    });

    execWs.on('message', (data: Buffer) => {
        const channel = data[0];
        const message = data.slice(1).toString();

        if (channel === 1) {
            console.log('exec stdout:', message);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        } else if (channel === 2) {
            console.log('exec stderr:', message);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(`Error: ${message}`);
            }
        }
    });

    execWs.on('error', (error: Error) => {
        console.error('exec websocket error:', error);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(`Error: ${error.message}`);
            ws.close();
        }
    });
}

async function createWebSocketConnection(wsUrl: string, cluster: Cluster, user: User): Promise<WebSocketOptions> {
    const wsOptions: WebSocketOptions = {
        agent: new Agent({
            rejectUnauthorized: true
        }),
        headers: {}
    };

    if (kubernetesService.isRunningInCluster()) {
        const tokenPath = path.join('/host-root', user.authProvider?.config.tokenFile || '');
        const caPath = path.join('/host-root', cluster.caFile || '');

        const token = fs.readFileSync(tokenPath, 'utf8');
        const ca = fs.readFileSync(caPath);

        wsOptions.agent = new Agent({
            ca: ca,
            rejectUnauthorized: !cluster.skipTLSVerify
        });
        wsOptions.headers['Authorization'] = `Bearer ${token}`;
    } else {
        const cert = user.certData ? Buffer.from(user.certData, 'base64') : undefined;
        const key = user.keyData ? Buffer.from(user.keyData, 'base64') : undefined;
        const ca = cluster.caData ? Buffer.from(cluster.caData, 'base64') : undefined;

        wsOptions.agent = new Agent({
            cert: cert,
            key: key,
            ca: ca,
            rejectUnauthorized: true
        });
    }

    return wsOptions;
}

export {
    executeCommand,
    createWebSocketConnection,
    constructFinalCommand,
    Cluster,
    User,
    WebSocketOptions
};
