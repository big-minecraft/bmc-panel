const k8s = require('@kubernetes/client-node');
const config = require('../config');

class KubernetesClient {
    constructor() {
        this.kc = new k8s.KubeConfig();
        this.loadConfiguration();
        this.coreV1Api = null;
        this.appsV1Api = null;
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

            console.log(`API objects: ${this.coreV1Api}, ${this.appsV1Api}`)

        } catch (error) {
            console.error('Error initializing Kubernetes client:', error);
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

        for (const path of pathsToTry) {
            try {
                this.kc.loadFromFile(path);
                console.log(`Loaded kubeconfig from ${path}`);
                return;
            } catch (error) {
                console.warn(`Failed to load kubeconfig from ${path}: ${error.message}`);
            }
        }
        throw new Error('Failed to load kubeconfig from all standard locations.');
    }

    isRunningInCluster() {
        return process.env.KUBERNETES_SERVICE_HOST !== undefined &&
            process.env.KUBERNETES_SERVICE_PORT !== undefined;
    }

    async scaleDeployment(deploymentName, replicas, namespace = 'default') {
        try {

            console.log(`AppsV1API: ${this.appsV1Api}`)
            const res = await this.appsV1Api.readNamespacedDeployment(deploymentName, namespace);
            const deployment = res.body;

            console.log('Scaling deployment:', deploymentName, 'to', replicas, 'replicas');
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
}

const kubernetesClient = new KubernetesClient();
module.exports = kubernetesClient;