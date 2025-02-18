import WebSocket from 'ws';
import {User, Cluster, getPodConnections} from "./podService";
import {executeCommand} from "./commandService";
import yaml from 'js-yaml';
import kubernetesService from "./kubernetesService";
import redisService from "./redisService";
import DeploymentManager from "../features/deployments/controllers/deploymentManager";
import {DeploymentValues} from "../features/deployments/models/types";
import {InstanceState} from "../../../shared/enum/enums/instance-state";
import {Enum} from "../../../shared/enum/enum";
import {Instance} from "../../../shared/model/instance";

const podStatusMap = new Map<string, string>();

async function stopPod(
    ws: WebSocket,
    deploymentName: string,
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    await executeCommand(ws, 'stop', podName, cluster, user, true);
    await executeCommand(ws, 'rm /tmp/should_run', podName, cluster, user, false);
    await updatePod(deploymentName, podName, Enum.InstanceState.STOPPING);
}

async function determineStartState(
    deployment: string,
): Promise<InstanceState> {
    const deploymentInstance = DeploymentManager.getDeploymentByName(deployment);
    const yamlContent = yaml.load(await deploymentInstance.getContent()) as DeploymentValues;

    const requireStartupConfirmation = yamlContent.queuing.requireStartupConfirmation;

    console.log(`Deployment ${deployment} requires startup confirmation: ${requireStartupConfirmation}`);

    return requireStartupConfirmation === 'true' ? Enum.InstanceState.STARTING : Enum.InstanceState.RUNNING;
}

async function startPod(
    ws: WebSocket,
    deploymentName: string,
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    await executeCommand(ws, 'touch /tmp/should_run', podName, cluster, user, false);

    const state = await determineStartState(deploymentName);

    await updatePod(deploymentName, podName, state);
}

async function killPod(
    deploymentName: string,
    podName: string
): Promise<void> {
    await kubernetesService.killPod(podName);
    await updatePod(deploymentName, podName, Enum.InstanceState.STOPPED);
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
            const currentState = podStatusMap.get(podName);
            if (currentState === 'STOPPED') {
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
    deploymentName: string,
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    await stopPod(ws, deploymentName, podName, cluster, user);
    await waitForPodStop(podName);
    await startPod(ws, deploymentName, podName, cluster, user);
}

async function executePowerAction(
    ws: WebSocket,
    action: 'start' | 'stop' | 'restart' | 'kill',
    deploymentName: string,
    podName: string,
    cluster: Cluster,
    user: User
): Promise<void> {
    try {
        switch (action) {
            case 'stop':
                await stopPod(ws, deploymentName, podName, cluster, user);
                break;

            case 'start':
                await startPod(ws, deploymentName, podName, cluster, user);
                break;

            case 'restart':
                await restartPod(ws, deploymentName, podName, cluster, user);
                break;

            case 'kill':
                await killPod(deploymentName, podName);
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

async function updatePod(deploymentName: string, podName: string, state: InstanceState) {
    podStatusMap.set(podName, state.identifier);

    await redisService.setPodState(deploymentName, podName, state);

    getPodConnections(podName).forEach(connection => {
        if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify({type: "power", content: state.identifier}));
        }
    });
}

export {
    executePowerAction,
    updatePod
};