const k8s = require('@kubernetes/client-node');
const config = require('../config.json');
const { Agent } = require("https");

const kc = new k8s.KubeConfig();
kc.loadFromFile(config.k8s.configPath);

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

async function scaleDeployment(deploymentName, replicas) {
    const kc = new k8s.KubeConfig();
    kc.loadFromFile(config.k8s.configPath);

    const cluster = kc.getCurrentCluster();
    cluster.skipTLSVerify = true;

    const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

    try {
        const res = await k8sApi.readNamespacedDeployment(deploymentName, 'default');
        const deployment = res.body;

        // Log current status before scaling
        // console.log('Current deployment status:', deployment.status);

        // Update the replica count
        console.log('Scaling deployment:', deploymentName, 'to', replicas, 'replicas');
        deployment.spec.replicas = replicas;

        const response = await k8sApi.replaceNamespacedDeployment(deploymentName, 'default', deployment);
        console.log('Deployment scaled successfully:', response.body);

        // Log status after scaling
        console.log('Updated deployment status:', response.body.status);

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
}