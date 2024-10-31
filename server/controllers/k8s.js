const k8s = require('@kubernetes/client-node');
const config = require('../config');
const { Agent } = require("https");

const kc = new k8s.KubeConfig();

function loadKubeConfigWithFallback() {
    const pathsToTry = [
        config.k8s.configPath,
        '/etc/rancher/k3s/k3s.yaml', // k3s default location
        '/etc/kubernetes/admin.conf', // Common Kubernetes location
        `${process.env.HOME}/.kube/config`, // Default kubeconfig location in user’s home directory
    ];

    for (const path of pathsToTry) {
        try {
            kc.loadFromFile(path);
            console.log(`Loaded kubeconfig from ${path}`);
            return;
        } catch (error) {
            console.warn(`Failed to load kubeconfig from ${path}: ${error.message}`);
        }
    }
    throw new Error('Failed to load kubeconfig from all standard locations.');
}

loadKubeConfigWithFallback();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

async function scaleDeployment(deploymentName, replicas) {
    const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

    const cluster = kc.getCurrentCluster();
    cluster.skipTLSVerify = true;

    try {
        const res = await k8sApi.readNamespacedDeployment(deploymentName, 'default');
        const deployment = res.body;

        console.log('Scaling deployment:', deploymentName, 'to', replicas, 'replicas');
        deployment.spec.replicas = replicas;

        const response = await k8sApi.replaceNamespacedDeployment(deploymentName, 'default', deployment);
        console.log('Deployment scaled successfully:', response.body);

        return response.body;
    } catch (error) {
        console.error('Error scaling deployment:', error);
        throw new Error(`Failed to scale deployment: ${error.message}`);
    }
}

module.exports = {
    k8sApi,
    kc,
    scaleDeployment
};
