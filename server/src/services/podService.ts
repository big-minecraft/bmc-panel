import * as k8s from '@kubernetes/client-node';
import { WebSocket } from 'ws';
import { setupPodLogs } from './logService';
import { executeCommand } from './commandService';
import kubernetesClient from '../controllers/k8s';

interface CommandMessage {
    command: string;
}

interface Cluster extends k8s.Cluster {
    // Add any additional cluster properties if needed
}

interface User extends k8s.User {
    // Add any additional user properties if needed
}

async function handlePodConnection(
    ws: WebSocket,
    req: any,
    podName: string
): Promise<void> {
    const cluster: Cluster = kubernetesClient.kc.getCurrentCluster();
    const user: User = kubernetesClient.kc.getCurrentUser();

    console.log(`Client connected for logs and commands of pod: ${podName}`);

    // console.log(`Cluster: ${JSON.stringify(cluster, null, 2)}`);
    // console.log('------------------------------------------')
    // console.log(`User: ${JSON.stringify(user, null, 2)}`);

    setupPodLogs(ws, podName, cluster, user);

    ws.on('message', async (message: WebSocket.Data) => {
        try {
            const { command } = JSON.parse(message.toString()) as CommandMessage;
            if (!command) {
                console.error('No command received');
                return;
            }

            await executeCommand(ws, command, podName, cluster, user);
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected from logs and commands of pod: ${podName}`);
    });
}

export {
    handlePodConnection,
    CommandMessage,
    Cluster,
    User
};