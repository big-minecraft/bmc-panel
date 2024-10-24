const k8s = require('@kubernetes/client-node');
const config = require('../config.json');

const kc = new k8s.KubeConfig();
kc.loadFromFile(config.k8s.configPath);

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const SERVER_TAG = "kyriji.dev/enable-panel-discovery";

module.exports = {
    k8sApi,
    kc,
}