const request = require('request');
const { Agent } = require("https");

function setupPodLogs(ws, podName, cluster, user) {
    const logOptions = {
        follow: true,
        tailLines: 100,
        pretty: true,
    };

    const logUrl = `${cluster.server}/api/v1/namespaces/default/pods/${podName}/log?follow=${logOptions.follow}&tailLines=${logOptions.tailLines}&pretty=${logOptions.pretty}`;

    const authOptions = {
        cert: Buffer.from(user.certData, 'base64'),
        key: Buffer.from(user.keyData, 'base64'),
        rejectUnauthorized: false,
    };

    const agent = new Agent(authOptions);

    request({
        url: logUrl,
        method: 'GET',
        agent: agent,
        json: false,
        encoding: null
    })
        .on('response', (response) => {
            console.log(`Started streaming logs for pod: ${podName}`);

            response.on('data', (chunk) => {
                const logMessage = chunk.toString();
                ws.send(logMessage);
            });

            response.on('end', () => {
                console.log(`Log stream ended for pod: ${podName}`);
                ws.close();
            });

            response.on('error', (err) => {
                console.error(`Error streaming logs for pod ${podName}:`, err);
                ws.close();
            });
        })
        .on('error', (err) => {
            console.error(`Failed to initiate log stream for pod ${podName}:`, err);
            ws.close();
        });
}

module.exports = {
    setupPodLogs
};