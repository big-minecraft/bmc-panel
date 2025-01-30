import * as k8s from '@kubernetes/client-node';
import WebSocket from 'ws';
import {setupPodLogs} from './logService';
import {executeCommand} from './commandService';
import {executePowerAction} from './powerActionService';
import kubernetesService from "./kubernetesService";

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
}

interface User extends k8s.User {
}

interface PodConnection {
    ws: WebSocket;
    deployment: string;
    podName: string;
    cluster: Cluster;
    user: User;
    connectedAt: Date;
    clientId: string;
}

class WebSocketRegistry {
    private static instance: WebSocketRegistry;
    private connections: Map<string, Set<PodConnection>>;

    private constructor() {
        this.connections = new Map();
    }

    public static getInstance(): WebSocketRegistry {
        if (!WebSocketRegistry.instance) {
            WebSocketRegistry.instance = new WebSocketRegistry();
        }
        return WebSocketRegistry.instance;
    }

    private generateClientId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    public addConnection(podName: string, connection: Omit<PodConnection, 'clientId' | 'connectedAt'>): string {
        const clientId = this.generateClientId();
        const fullConnection: PodConnection = {
            ...connection,
            clientId,
            connectedAt: new Date()
        };

        if (!this.connections.has(podName)) {
            this.connections.set(podName, new Set());
        }

        this.connections.get(podName)!.add(fullConnection);
        return clientId;
    }

    public removeConnection(podName: string, clientId: string): void {
        const podConnections = this.connections.get(podName);
        if (podConnections) {
            for (const conn of podConnections) {
                if (conn.clientId === clientId) {
                    podConnections.delete(conn);
                    break;
                }
            }

            if (podConnections.size === 0) {
                this.connections.delete(podName);
            }
        }
    }

    public getConnections(podName: string): Set<PodConnection> | undefined {
        return this.connections.get(podName);
    }

    public getConnection(podName: string, clientId: string): PodConnection | undefined {
        const podConnections = this.connections.get(podName);
        if (podConnections) {
            return Array.from(podConnections).find(conn => conn.clientId === clientId);
        }
        return undefined;
    }

    public getAllConnections(): Map<string, Set<PodConnection>> {
        return new Map(this.connections);
    }

    public getActiveConnectionCount(): number {
        let count = 0;
        for (const connections of this.connections.values()) {
            count += connections.size;
        }
        return count;
    }

    public broadcastToPod(podName: string, message: any): void {
        const connections = this.connections.get(podName);
        if (connections) {
            const messageString = JSON.stringify(message);
            connections.forEach(connection => {
                if (connection.ws.readyState === WebSocket.OPEN) {
                    connection.ws.send(messageString);
                }
            });
        }
    }
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
    deployment: string | undefined,
    podName: string
): Promise<void> {
    const cluster: Cluster = kubernetesService.kc.getCurrentCluster();
    const user: User = kubernetesService.kc.getCurrentUser();
    const registry = WebSocketRegistry.getInstance();

    const clientId = registry.addConnection(podName, {
        ws,
        deployment,
        podName,
        cluster,
        user
    });

    console.log(`Client ${clientId} connected to pod: ${podName}${deployment ? ` in deployment: ${deployment}` : ''}`);

    await setupPodLogs(ws, deployment, podName, cluster, user);

    ws.on('message', async (message: WebSocket.Data) => {
        try {
            const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;

            if (!parsedMessage.type) {
                throw new Error('Message type not specified');
            }

            if (isPowerActionMessage(parsedMessage)) {
                await executePowerAction(ws, parsedMessage.action, deployment, podName, cluster, user);
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
        registry.removeConnection(podName, clientId);
        console.log(`Client ${clientId} disconnected from pod: ${podName}`);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId} on pod ${podName}:`, error);
        registry.removeConnection(podName, clientId);
    });
}

function getPodConnections(podName: string): Set<PodConnection> | undefined {
    return WebSocketRegistry.getInstance().getConnections(podName);
}

function getPodConnection(podName: string, clientId: string): PodConnection | undefined {
    return WebSocketRegistry.getInstance().getConnection(podName, clientId);
}

function broadcastToPod(podName: string, message: any): void {
    WebSocketRegistry.getInstance().broadcastToPod(podName, message);
}

function getActiveConnectionCount(): number {
    return WebSocketRegistry.getInstance().getActiveConnectionCount();
}

export {
    handlePodConnection,
    CommandMessage,
    PowerActionMessage,
    WebSocketMessage,
    Cluster,
    User,
    PodConnection,
    getPodConnections,
    getPodConnection,
    broadcastToPod,
    getActiveConnectionCount
};