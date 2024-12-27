import WebSocket from 'ws';
import {User, Cluster} from "./podService";
import {executeCommand} from "./commandService";
import kubernetesClient from "../controllers/k8s";
import {setPodStatus} from "../controllers/redis";

async function executePowerAction(
    ws: WebSocket,
    action: 'start' | 'stop' | 'restart' | 'kill',
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    try {
        switch (action) {
            case 'stop':
                await executeCommand(ws, 'stop', podName, cluster, user, true);
                await executeCommand(ws, 'rm /tmp/should_run', podName, cluster, user, false);
                await setPodStatus(podName, 'STOPPED');
                ws.send(JSON.stringify({type: "power", content: "STOPPED"}));
                break;

            case 'start':
                await executeCommand(ws, 'touch /tmp/should_run', podName, cluster, user, false);
                await setPodStatus(podName, 'STARTING');
                ws.send(JSON.stringify({type: "power", content: "STARTING"}));
                break;

            case 'restart':
                await executeCommand(ws, 'stop', podName, cluster, user, true);
                await setPodStatus(podName, 'STOPPING');
                ws.send(JSON.stringify({type: "power", content: "STOPPING"}));
                break;

            case 'kill':
                await kubernetesClient.killPod(podName);
                await setPodStatus(podName, 'STOPPED');
                ws.send(JSON.stringify({type: "power", content: "STOPPED"}));
                break;
            default:
                throw new Error(`Unsupported power action: ${action}`);
        }
    } catch (error) {
        console.error(`Error executing power action ${action}:`, error);
        ws.send(JSON.stringify({type: "error", content: `Error executing power action: ${error instanceof Error ? error.message : 'Unknown error'}`}));
    }
}

export {
    executePowerAction
};
