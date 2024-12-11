const k8s = require('@kubernetes/client-node');
const config = require('../config');

class KubernetesClient {
    static instance = null;

    constructor() {
        if (KubernetesClient.instance) {
            return KubernetesClient.instance;
        }

        this.kc = new k8s.KubeConfig();
        this.coreV1Api = null;
        this.appsV1Api = null;
        this.initialized = false;

        // Bind methods
        this.scaleDeployment = this.scaleDeployment.bind(this);
        this.loadConfiguration = this.loadConfiguration.bind(this);
        this.loadLocalConfig = this.loadLocalConfig.bind(this);
        this.isRunningInCluster = this.isRunningInCluster.bind(this);

        // Initialize immediately
        this.initialize();

        KubernetesClient.instance = this;
    }

    initialize() {
        try {
            this.loadConfiguration();
            this.initialized = true;
            console.log('Kubernetes client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Kubernetes client:', error);
            this.initialized = false;
        }
    }

    loadConfiguration() {
        try {
            if (this.isRunningInCluster()) {
                console.log('Loading in-cluster configuration');
                this.kc.loadFromCluster();

                const cluster = this.kc.getCurrentCluster();
                if (cluster) {
                    cluster.skipTLSVerify = false;
                    cluster.server = 'https://kubernetes.default.svc';
                }
            } else {
                console.log('Loading local development configuration');
                this.loadLocalConfig();
            }

            this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
            this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);

            if (!this.coreV1Api || !this.appsV1Api) {
                throw new Error('Failed to create API clients');
            }

            console.log('Kubernetes API clients created successfully');

        } catch (error) {
            console.error('Error in loadConfiguration:', error);
            throw new Error(`Failed to initialize Kubernetes client: ${error.message}`);
        }
    }

    loadLocalConfig() {
        const pathsToTry = [
            config.k8s.configPath,
            '/host-root/etc/rancher/k3s/k3s.yaml',
            '/host-root/etc/kubernetes/admin.conf',
            `${process.env.HOME}/.kube/config`,
        ];

        let lastError = null;
        for (const path of pathsToTry) {
            try {
                this.kc.loadFromFile(path);
                console.log(`Loaded kubeconfig from ${path}`);
                return;
            } catch (error) {
                lastError = error;
                console.warn(`Failed to load kubeconfig from ${path}: ${error.message}`);
            }
        }
        throw new Error(`Failed to load kubeconfig from all locations. Last error: ${lastError?.message}`);
    }

    isRunningInCluster() {
        return process.env.KUBERNETES_SERVICE_HOST !== undefined &&
            process.env.KUBERNETES_SERVICE_PORT !== undefined;
    }

    ensureInitialized() {
        if (!this.initialized || !this.appsV1Api) {
            // Try to reinitialize if not initialized
            this.initialize();

            if (!this.initialized || !this.appsV1Api) {
                throw new Error('Kubernetes client initialization failed. Please check your kubeconfig and permissions.');
            }
        }
    }

    async scaleDeployment(deploymentName, replicas, namespace = 'default') {
        this.ensureInitialized();

        try {
            console.log(`Scaling deployment ${deploymentName} in namespace ${namespace} to ${replicas} replicas`);

            const res = await this.appsV1Api.readNamespacedDeployment(deploymentName, namespace);
            const deployment = res.body;

            deployment.spec.replicas = replicas;

            const response = await this.appsV1Api.replaceNamespacedDeployment(
                deploymentName,
                namespace,
                deployment
            );
            console.log('Deployment scaled successfully:', response.body);

            return response.body;
        } catch (error) {
            console.error('Error scaling deployment:', error);
            throw new Error(`Failed to scale deployment: ${error.message}`);
        }
    }

    // Add a method to check the client status
    getStatus() {
        return {
            initialized: this.initialized,
            hasAppsV1Api: !!this.appsV1Api,
            hasCoreV1Api: !!this.coreV1Api,
        };
    }

    async listNodeNames() {
        this.ensureInitialized();

        try {
            const res = await this.coreV1Api.listNode();
            const nodes = res.body.items;

            return nodes.map(node => node.metadata.name);
        } catch (error) {
            console.error('Error fetching nodes:', error);
            return [];
        }
    }

}

// Create and export a singleton instance
const kubernetesClient = new KubernetesClient();

// Add some debug information
console.log('Kubernetes client status after creation:', kubernetesClient.getStatus());

module.exports = kubernetesClient;