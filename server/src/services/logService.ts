import {WebSocket} from 'ws';
import axios from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import DeploymentManager from "../features/deployments/controllers/deploymentManager";
import {Enum} from "../../../shared/enum/enum";
import KubernetesService from "./kubernetesService";

interface LogOptions {
    follow: boolean;
    tailLines: number;
    pretty: boolean;
}

interface Cluster {
    server: string;
    caFile?: string;
    caData?: string;
    skipTLSVerify?: boolean;
}

interface User {
    certData?: string;
    keyData?: string;
    authProvider?: {
        config: {
            tokenFile: string;
        };
    };
}

export async function setupPodLogs(ws: WebSocket, deployment: string, podName: string, cluster: Cluster, user: User): Promise<void> {
    if (!podName) {
        throw new Error('Pod name is required');
    }

    // Setup log options
    const logOptions: LogOptions = {
        follow: true,
        tailLines: 100,
        pretty: true,
    };

    let deploymentInstance = DeploymentManager.getDeploymentByName(deployment);

    // Construct log URL

    let containerName = deploymentInstance?.type.containerName;
    let containerQuery = containerName ? `container=${containerName}` : '';

    const logUrl = `${cluster.server}/api/v1/namespaces/default/pods/${podName}/log?${containerQuery}&follow=${logOptions.follow}&tailLines=${logOptions.tailLines}&pretty=${logOptions.pretty}`;

    let httpsAgent: https.Agent | undefined;
    let headers: Record<string, string> = {};

    try {
        if (KubernetesService.getInstance().isRunningInCluster()) {
            console.log('running in cluster environment');
            const tokenPath = '/var/run/secrets/kubernetes.io/serviceaccount/token';
            const caPath = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt';

            const token = fs.readFileSync(tokenPath, 'utf8');
            const ca = fs.readFileSync(caPath);

            headers = {
                'Authorization': `Bearer ${token}`
            };

            httpsAgent = new https.Agent({
                ca: ca,
                rejectUnauthorized: !cluster.skipTLSVerify
            });
        } else {
            console.log('running in development environment');
            if (!user.certData || !user.keyData) {
                throw new Error('Certificate data and key data are required for development environment');
            }

            const cert = Buffer.from(user.certData, 'base64');
            const key = Buffer.from(user.keyData, 'base64');
            const ca = cluster.caData ? Buffer.from(cluster.caData, 'base64') : undefined;

            httpsAgent = new https.Agent({
                cert: cert,
                key: key,
                ca: ca,
                rejectUnauthorized: false
            });
        }

        const response = await axios({
            method: 'GET',
            url: logUrl,
            headers: headers,
            httpsAgent: httpsAgent,
            responseType: 'stream'
        });

        console.log(`started streaming logs for pod: ${podName}`);

        response.data.on('data', (chunk: Buffer) => {
            try {
                const logMessage = chunk.toString();
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({type: "message", content: logMessage}));
                }
            } catch (err) {
                console.error('error processing log message:', err);
            }
        });

        response.data.on('end', () => {
            console.log(`log stream ended for pod: ${podName}`);
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });

        response.data.on('error', (err: Error) => {
            console.error(`error streaming logs for pod ${podName}:`, err);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: "error", content: `Error streaming logs: ${err.message}`}));
                ws.close();
            }
        });

        ws.on('close', () => {
            console.log(`client disconnected from logs and commands of pod: ${podName}`);
            // Abort the stream when the WebSocket closes
            response.data.destroy();
        });

    } catch (err) {
        console.error(`failed to initiate log stream for pod ${podName}:`, err);

        // Try to get the actual error message from Kubernetes
        let errorMessage = (err as Error).message;
        if (axios.isAxiosError(err) && err.response) {
            try {
                // If response is a stream, read it
                if (err.response.data && typeof err.response.data.read === 'function') {
                    const chunks: Buffer[] = [];
                    for await (const chunk of err.response.data) {
                        chunks.push(chunk);
                    }
                    const responseBody = Buffer.concat(chunks).toString();
                    console.error(`Kubernetes API error response: ${responseBody}`);

                    // Try to parse as JSON
                    try {
                        const errorData = JSON.parse(responseBody);
                        if (errorData.message) {
                            errorMessage = errorData.message;
                        }
                    } catch {
                        errorMessage = responseBody;
                    }
                } else if (typeof err.response.data === 'string') {
                    console.error(`Kubernetes API error response: ${err.response.data}`);
                    errorMessage = err.response.data;
                }
            } catch (parseErr) {
                console.error('Failed to parse error response:', parseErr);
            }
        }

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({type: "error", content: `Failed to initiate log stream: ${errorMessage}`}));
            ws.close();
        }
    }
}
