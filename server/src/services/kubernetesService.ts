import * as K8s from '@kubernetes/client-node';
import ConfigManager from "../features/config/controllers/configManager";
import {ScalableKind} from "../../../shared/enum/enums/deployment-type";

interface KubernetesClientStatus {
    initialized: boolean;
    hasAppsV1Api: boolean;
    hasCoreV1Api: boolean;
}

interface KubernetesConfig {
    k8s: {
        configPath: string;
    };
}

class KubernetesClient {
    private static instance: KubernetesClient;
    kc: K8s.KubeConfig;
    private coreV1Api: K8s.CoreV1Api | null;
    private appsV1Api: K8s.AppsV1Api | null;
    private initialized: boolean;

    private constructor() {
        this.kc = new K8s.KubeConfig();
        this.coreV1Api = null;
        this.appsV1Api = null;
        this.initialized = false;

        this.initializeConfig();
    }

    public static getInstance(): KubernetesClient {
        return KubernetesClient.instance;
    }

    public static init(): void {
        KubernetesClient.instance = new KubernetesClient();
    }

    private initializeConfig(): void {
        try {
            this.loadConfiguration();
            this.initialized = true;
            console.log('Kubernetes client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Kubernetes client:', error);
            this.initialized = false;
        }
    }

    private loadConfiguration(): void {
        try {
            if (this.isRunningInCluster()) {
                console.log('Loading in-cluster configuration');
                this.kc.loadFromCluster();
            } else {
                console.log('Loading local development configuration');
                this.loadLocalConfig();
            }

            this.createApiClients();
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error occurred');
            console.error('Error in loadConfiguration:', err);
            throw new Error(`Failed to initialize Kubernetes client: ${err.message}`);
        }
    }

    private createApiClients(): void {
        try {
            this.coreV1Api = this.kc.makeApiClient(K8s.CoreV1Api);
            this.appsV1Api = this.kc.makeApiClient(K8s.AppsV1Api);

            if (!this.coreV1Api || !this.appsV1Api) {
                throw new Error('Failed to create API clients');
            }

            console.log('Kubernetes API clients created successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error occurred');
            throw new Error(`Failed to create API clients: ${err.message}`);
        }
    }

    private loadLocalConfig(): void {
        const typedConfig = ConfigManager.getConfig() as KubernetesConfig;
        const pathsToTry: string[] = [
            typedConfig.k8s.configPath,
            `${process.env.HOME || ''}/.kube/config`,
        ];

        let lastError: Error | null = null;
        for (const path of pathsToTry) {
            try {
                this.kc.loadFromFile(path);
                console.log(`Loaded kubeconfig from ${path}`);
                return;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error occurred');
                console.warn(`Failed to load kubeconfig from ${path}: ${lastError.message}`);
            }
        }
        throw new Error(`Failed to load kubeconfig from all locations. Last error: ${lastError?.message}`);
    }

    public isRunningInCluster(): boolean {
        return typeof process.env.KUBERNETES_SERVICE_HOST === 'string' &&
            typeof process.env.KUBERNETES_SERVICE_PORT === 'string';
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.appsV1Api) {
            this.initializeConfig();

            if (!this.initialized || !this.appsV1Api) {
                throw new Error('Kubernetes client initialization failed. Please check your kubeconfig and permissions.');
            }
        }
    }

    public async scaleWorkload(
        kind: ScalableKind,
        name: string,
        replicas: number,
        namespace = 'default'
    ): Promise<number> {
        this.ensureInitialized();

        if (!this.appsV1Api) {
            throw new Error('AppsV1Api is not initialized');
        }

        let scale;

        if (kind === 'Deployment') {
            const res = await this.appsV1Api.readNamespacedDeploymentScale(name, namespace);
            scale = res.body;
        } else {
            const res = await this.appsV1Api.readNamespacedStatefulSetScale(name, namespace);
            scale = res.body;
        }

        if (!scale.spec) throw new Error('Scale spec is undefined');

        scale.spec.replicas = replicas;

        if (kind === 'Deployment') {
            const res = await this.appsV1Api.replaceNamespacedDeploymentScale(
                name,
                namespace,
                scale
            )
            return res.body.spec!.replicas!;
        } else {
            const res = await this.appsV1Api.replaceNamespacedStatefulSetScale(
                name,
                namespace,
                scale
            )
            return res.body.spec!.replicas!;
        }
    }

    public getStatus(): KubernetesClientStatus {
        return {
            initialized: this.initialized,
            hasAppsV1Api: !!this.appsV1Api,
            hasCoreV1Api: !!this.coreV1Api,
        };
    }

    public async killPod(podName: string, namespace: string = 'default'): Promise<void> {
        this.ensureInitialized();

        if (!this.coreV1Api) {
            throw new Error('CoreV1Api is not initialized');
        }

        try {
            console.log(`Deleting pod ${podName} in namespace ${namespace}`);
            await this.coreV1Api.deleteNamespacedPod(podName, namespace);
            console.log('Pod deleted successfully');
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error occurred');
            console.error('Error deleting pod:', err);
            throw new Error(`Failed to delete pod: ${err.message}`);
        }
    }

    public async getPodResourceSpecs(podName: string, namespace: string = 'default'): Promise<{
        cpuRequest?: number;
        cpuLimit?: number;
        memoryRequest?: number;
        memoryLimit?: number;
        startTime?: Date;
    }> {
        this.ensureInitialized();

        if (!this.coreV1Api) {
            throw new Error('CoreV1Api is not initialized');
        }

        try {
            const response = await this.coreV1Api.readNamespacedPod(podName, namespace);
            const pod = response.body;

            let cpuRequest: number | undefined;
            let cpuLimit: number | undefined;
            let memoryRequest: number | undefined;
            let memoryLimit: number | undefined;

            if (pod.spec?.containers) {
                for (const container of pod.spec.containers) {
                    const resources = container.resources;

                    if (resources?.requests?.cpu) {
                        cpuRequest = (cpuRequest || 0) + this.parseCPU(resources.requests.cpu);
                    }
                    if (resources?.limits?.cpu) {
                        cpuLimit = (cpuLimit || 0) + this.parseCPU(resources.limits.cpu);
                    }
                    if (resources?.requests?.memory) {
                        memoryRequest = (memoryRequest || 0) + this.parseMemory(resources.requests.memory);
                    }
                    if (resources?.limits?.memory) {
                        memoryLimit = (memoryLimit || 0) + this.parseMemory(resources.limits.memory);
                    }
                }
            }

            return {
                cpuRequest,
                cpuLimit,
                memoryRequest,
                memoryLimit,
                startTime: pod.status?.startTime ? new Date(pod.status.startTime) : undefined
            };
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error occurred');
            console.error(`Error fetching pod resource specs for ${podName}:`, err);
            throw new Error(`Failed to fetch pod resource specs: ${err.message}`);
        }
    }

    private parseCPU(cpu: string): number {
        if (cpu.endsWith('m')) {
            return parseFloat(cpu.slice(0, -1)) / 1000;
        }
        return parseFloat(cpu);
    }

    private parseMemory(memory: string): number {
        const units: { [key: string]: number } = {
            'Ki': 1024,
            'Mi': 1024 * 1024,
            'Gi': 1024 * 1024 * 1024,
            'K': 1000,
            'M': 1000 * 1000,
            'G': 1000 * 1000 * 1000,
        };

        for (const [suffix, multiplier] of Object.entries(units)) {
            if (memory.endsWith(suffix)) {
                const value = parseFloat(memory.slice(0, -suffix.length));
                return (value * multiplier) / (1024 * 1024);
            }
        }

        return parseFloat(memory) / (1024 * 1024);
    }
}

export default KubernetesClient;