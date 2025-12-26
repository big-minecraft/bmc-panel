import PrometheusService from './prometheusService';
import KubernetesClient from './kubernetesService';
import RedisService from './redisService';
import { getPodConnections } from './podService';
import SocketManager from '../features/socket/controllers/socket-manager';
import DeploymentManager from '../features/deployments/controllers/deploymentManager';
import { Instance, InstanceResourceMetrics } from '../../../shared/model/instance';
import { Enum } from '../../../shared/enum/enum';

class InstanceMetricsService {
    private static instance: InstanceMetricsService;
    private prometheusService: PrometheusService;
    private kubernetesClient: KubernetesClient;
    private redisService: RedisService;
    private socketManager: SocketManager | null = null;
    private updateInterval: NodeJS.Timeout | null = null;
    private readonly UPDATE_INTERVAL_MS = 5000; // 5 seconds

    private constructor() {
        this.prometheusService = PrometheusService.getInstance();
        this.kubernetesClient = KubernetesClient.getInstance();
        this.redisService = RedisService.getInstance();
    }

    public static getInstance(): InstanceMetricsService {
        if (!InstanceMetricsService.instance) {
            InstanceMetricsService.instance = new InstanceMetricsService();
        }
        return InstanceMetricsService.instance;
    }

    public setSocketManager(socketManager: SocketManager): void {
        this.socketManager = socketManager;
    }

    public async startBroadcasting(): Promise<void> {
        if (this.updateInterval) {
            console.log('Instance metrics broadcasting already started');
            return;
        }

        console.log('Starting instance metrics broadcasting...');
        await this.broadcastMetrics();
        this.updateInterval = setInterval(() => {
            this.broadcastMetrics();
        }, this.UPDATE_INTERVAL_MS);
    }

    public stopBroadcasting(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('Stopped instance metrics broadcasting');
        }
    }

    private async broadcastMetrics(): Promise<void> {
        if (!this.socketManager) {
            console.warn('SocketManager not set, skipping metrics broadcast');
            return;
        }

        try {
            const deployments = DeploymentManager.getDeployments();

            for (const deployment of deployments) {
                const instances = await this.redisService.getInstances(deployment);

                for (const instance of instances) {
                    const metrics = await this.getInstanceMetrics(instance);
                    instance.metrics = metrics;

                    this.socketManager.sendAll(
                        Enum.SocketMessageType.INSTANCE_METRICS_UPDATE,
                        {
                            podName: instance.podName,
                            deployment: instance.deployment,
                            metrics
                        }
                    );
                }
            }
        } catch (error) {
            console.error('Error broadcasting instance metrics:', error);
        }
    }

    private async getInstanceMetrics(instance: Instance): Promise<InstanceResourceMetrics> {
        const namespace = 'default';

        try {
            const [currentCpu, currentMemory, resourceSpecs, connections] = await Promise.all([
                this.getCurrentCPU(instance.podName, namespace),
                this.getCurrentMemory(instance.podName, namespace),
                this.kubernetesClient.getPodResourceSpecs(instance.podName, namespace),
                this.getConnectionCount(instance.podName)
            ]);

            const uptime = this.calculateUptime(resourceSpecs.startTime);

            return {
                cpu: {
                    usage: currentCpu,
                    request: resourceSpecs.cpuRequest,
                    limit: resourceSpecs.cpuLimit
                },
                memory: {
                    usage: currentMemory,
                    request: resourceSpecs.memoryRequest,
                    limit: resourceSpecs.memoryLimit
                },
                uptime,
                connections
            };
        } catch (error) {
            console.error(`Error fetching metrics for instance ${instance.podName}:`, error);
            return {
                cpu: { usage: 0 },
                memory: { usage: 0 },
                uptime: 'Unknown',
                connections: 0
            };
        }
    }

    private async getCurrentCPU(podName: string, namespace: string): Promise<number> {
        try {
            return await this.prometheusService.getCurrentCPUUsage(podName, namespace);
        } catch (error) {
            console.error(`Error fetching CPU for ${podName}:`, error);
            return 0;
        }
    }

    private async getCurrentMemory(podName: string, namespace: string): Promise<number> {
        try {
            return await this.prometheusService.getCurrentMemoryUsage(podName, namespace);
        } catch (error) {
            console.error(`Error fetching memory for ${podName}:`, error);
            return 0;
        }
    }

    private getConnectionCount(podName: string): number {
        const connections = getPodConnections(podName);
        return connections ? connections.size : 0;
    }

    private calculateUptime(startTime?: Date): string {
        if (!startTime) {
            return 'Unknown';
        }

        const now = new Date();
        const uptimeMs = now.getTime() - startTime.getTime();

        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    }
}

export default InstanceMetricsService;
