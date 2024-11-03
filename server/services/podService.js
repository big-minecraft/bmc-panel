const k8s = require('@kubernetes/client-node');
const { Agent } = require("https");
const request = require('request');
const { setupPodLogs } = require('./logService');
const { executeCommand } = require('./commandService');
const { kc } = require('../controllers/k8s');

async function handlePodConnection(ws, req, podName) {
    const cluster = kc.getCurrentCluster();
    const user = kc.getCurrentUser();

    console.log(`Client connected for logs and commands of pod: ${podName}`);

    console.log(`Cluster: ${cluster.toString()}`);
    console.log(`User: ${user.toString()}`);

    setupPodLogs(ws, podName, cluster, user);

    ws.on('message', async (message) => {
        try {
            const { command } = JSON.parse(message);
            if (!command) {
                console.error('No command received');
                return;
            }

            await executeCommand(ws, command, podName, cluster, user);
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(`Error: ${error.message}`);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected from logs and commands of pod: ${podName}`);
    });
}

module.exports = {
    handlePodConnection
};