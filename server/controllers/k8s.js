const k8s = require('@kubernetes/client-node');
const config = require('../config.json');

const kc = new k8s.KubeConfig();
kc.loadFromFile(config.k8s.configPath);

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const SERVER_TAG = "kyriji.dev/enable-panel-discovery";

async function getPods(namespace) {
    try {
        const res = await k8sApi.listNamespacedPod(namespace);
        const pods = res.body.items;
        return pods.filter(pod => {
            return pod.metadata.labels && pod.metadata.labels[SERVER_TAG] === "true";
        });
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    k8sApi,
    kc,
    getPods,
}