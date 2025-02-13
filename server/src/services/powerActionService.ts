import WebSocket from 'ws';
import {User, Cluster, getPodConnections} from "./podService";
import {executeCommand} from "./commandService";
import yaml from 'js-yaml';
import kubernetesService from "./kubernetesService";
import redisService from "./redisService";
import DeploymentManager from "../features/deployments/controllers/deploymentManager";
import {DeploymentValues} from "../features/deployments/models/types";

const podStatusMap = new Map<string, string>();

async function stopPod(
    ws: WebSocket,
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    await executeCommand(ws, 'stop', podName, cluster, user, true);
    await executeCommand(ws, 'rm /tmp/should_run', podName, cluster, user, false);
    await updatePod(podName, 'STOPPING');
}

async function  determineStartStatus(
    deployment: string,
    isProxy: boolean
): Promise<string> {
    if (isProxy) return 'RUNNING';

    const deploymentInstance = await DeploymentManager.getDeploymentByName(deployment);
    const yamlContent = yaml.load(deploymentInstance.getContent()) as DeploymentValues;
    const requireStartupConfirmation = yamlContent.queuing.requireStartupConfirmation;

    console.log(yamlContent);
    console.log(`Deployment ${deployment} requires startup confirmation: ${requireStartupConfirmation}`);

    return requireStartupConfirmation === 'true' ? 'STARTING' : 'RUNNING';
}

async function startPod(
    ws: WebSocket,
    deployment: string,
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    await executeCommand(ws, 'touch /tmp/should_run', podName, cluster, user, false);

    const isProxy = podName.includes('proxy');
    const status = await determineStartStatus(deployment, isProxy);

    await updatePod(podName, status);
}

async function killPod(
    podName: string
): Promise<void> {
    await kubernetesService.killPod(podName);
    await updatePod(podName, 'STOPPED');
}

async function waitForPodStop(
    podName: string,
    timeoutMs: number = 30000
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout waiting for pod to stop'));
        }, timeoutMs);

        const checkStatus = () => {
            const currentStatus = podStatusMap.get(podName);
            if (currentStatus === 'STOPPED') {
                cleanup();
                resolve();
            }
        };

        const interval = setInterval(checkStatus, 500);
        const cleanup = () => {
            clearInterval(interval);
            clearTimeout(timeout);
            podStatusMap.delete(podName);
        };

        checkStatus();
    });
}

async function restartPod(
    ws: WebSocket,
    deployment: string,
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    await stopPod(ws, podName, cluster, user);
    await waitForPodStop(podName);
    await startPod(ws, deployment, podName, cluster, user);
}

async function executePowerAction(
    ws: WebSocket,
    action: 'start' | 'stop' | 'restart' | 'kill',
    deployment: string,
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    try {
        switch (action) {
            case 'stop':
                await stopPod(ws, podName, cluster, user);
                break;

            case 'start':
                await startPod(ws, deployment, podName, cluster, user);
                break;

            case 'restart':
                await restartPod(ws, deployment, podName, cluster, user);
                break;

            case 'kill':
                await killPod(podName);
                break;

            default:
                throw new Error(`Unsupported power action: ${action}`);
        }
    } catch (error) {
        console.error(`Error executing power action ${action}:`, error);
        ws.send(JSON.stringify({
            type: "error",
            content: `Error executing power action: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
    }
}

async function updatePod(podName: string, action: string) {
    podStatusMap.set(podName, action);

    await redisService.setPodStatus(podName, action);

    getPodConnections(podName).forEach(connection => {
        if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify({type: "power", content: action}));
        }
    });
}

export {
    executePowerAction,
    updatePod
};