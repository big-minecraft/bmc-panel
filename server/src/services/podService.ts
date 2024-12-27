import * as k8s from '@kubernetes/client-node';
import WebSocket from 'ws';
import {setupPodLogs} from './logService';
import {executeCommand} from './commandService';
import {executePowerAction} from './powerActionService'; // New service for power actions
import kubernetesClient from '../controllers/k8s';

interface BaseMessage {
    type: 'command' | 'power';
}

interface CommandMessage extends BaseMessage {
    type: 'command';
    command: string;
}

interface PowerActionMessage extends BaseMessage {
    type: 'power';
    action: 'start' | 'stop' | 'restart' | 'kill';
}

type WebSocketMessage = CommandMessage | PowerActionMessage;

interface Cluster extends k8s.Cluster {
    // Add any additional cluster properties if needed
}

interface User extends k8s.User {
    // Add any additional user properties if needed
}

function isPowerActionMessage(message: WebSocketMessage): message is PowerActionMessage {
    return message.type === 'power';
}

function isCommandMessage(message: WebSocketMessage): message is CommandMessage {
    return message.type === 'command';
}

async function handlePodConnection(
    ws: WebSocket,
    req: any,
    podName: string
): Promise<void> {
    const cluster: Cluster = kubernetesClient.kc.getCurrentCluster();
    const user: User = kubernetesClient.kc.getCurrentUser();

    console.log(`Client connected for logs and commands of pod: ${podName}`);

    setupPodLogs(ws, podName, cluster, user);

    ws.on('message', async (message: WebSocket.Data) => {
        try {
            const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;

            if (!parsedMessage.type) {
                throw new Error('Message type not specified');
            }

            if (isPowerActionMessage(parsedMessage)) {
                await executePowerAction(ws, parsedMessage.action, podName, cluster, user);
            } else if (isCommandMessage(parsedMessage)) {
                if (!parsedMessage.command) {
                    throw new Error('No command specified');
                }
                await executeCommand(ws, parsedMessage.command, podName, cluster, user, true);
            } else {
                throw new Error('Invalid message type');
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({type: "error", content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`}));
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected from logs and commands of pod: ${podName}`);
    });
}

export {
    handlePodConnection,
    CommandMessage,
    PowerActionMessage,
    WebSocketMessage,
    Cluster,
    User
};
