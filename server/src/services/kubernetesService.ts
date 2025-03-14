import * as K8s from '@kubernetes/client-node';
import ConfigManager from "../controllers/config/controllers/configManager";

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
            '/host-root/etc/rancher/k3s/k3s.yaml',
            '/host-root/etc/kubernetes/admin.conf',
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

    public async scaleDeployment(deploymentName: string, replicas: number): Promise<K8s.V1Deployment> {
        this.ensureInitialized();
        let namespace = 'default';

        if (!this.appsV1Api) {
            throw new Error('AppsV1Api is not initialized');
        }

        try {
            console.log(`Scaling deployment ${deploymentName} to ${replicas} replicas`);

            const res = await this.appsV1Api.readNamespacedDeployment(deploymentName, namespace);
            const deployment = res.body;

            if (!deployment.spec) {
                throw new Error('Deployment spec is undefined');
            }

            deployment.spec.replicas = replicas;

            const response = await this.appsV1Api.replaceNamespacedDeployment(
                deploymentName,
                namespace,
                deployment
            );

            if (!response.body) {
                throw new Error('Response body is undefined');
            }

            console.log(`Deployment ${deploymentName} scaled successfully`);
            return response.body;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error occurred');
            console.error('Error scaling deployment:', err);
            throw new Error(`Failed to scale deployment: ${err.message}`);
        }
    }

    public getStatus(): KubernetesClientStatus {
        return {
            initialized: this.initialized,
            hasAppsV1Api: !!this.appsV1Api,
            hasCoreV1Api: !!this.coreV1Api,
        };
    }

    public async listNodeNames(): Promise<string[]> {
        this.ensureInitialized();

        if (!this.coreV1Api) {
            throw new Error('CoreV1Api is not initialized');
        }

        try {
            const res = await this.coreV1Api.listNode();
            const nodes = res.body.items;

            return nodes.map(node => {
                if (!node.metadata?.name) {
                    throw new Error('Node metadata or name is undefined');
                }
                return node.metadata.name;
            });
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error occurred');
            console.error('Error fetching nodes:', err);
            return [];
        }
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
}

export default KubernetesClient;