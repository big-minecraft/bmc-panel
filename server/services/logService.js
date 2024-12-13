const request = require('request');
const { Agent } = require("https");
const fs = require('fs');
const path = require('path');

function setupPodLogs(ws, podName, cluster, user) {
    if (!podName) {
        throw new Error('Pod name is required');
    }

    const logOptions = {
        follow: true,
        tailLines: 100,
        pretty: true,
    };

    const logUrl = `${cluster.server}/api/v1/namespaces/default/pods/${podName}/log?container=mc&follow=${logOptions.follow}&tailLines=${logOptions.tailLines}&pretty=${logOptions.pretty}`;
    // Prepend /host-root to file paths
    const tokenPath = path.join('/host-root', user.authProvider.config.tokenFile);
    const caPath = path.join('/host-root', cluster.caFile);

    // Read the token and CA cert from the host-root prefixed paths
    const token = fs.readFileSync(tokenPath, 'utf8');
    const ca = fs.readFileSync(caPath);

    const requestOptions = {
        url: logUrl,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        agentOptions: {
            ca: ca,
            rejectUnauthorized: !cluster.skipTLSVerify
        },
        json: false,
        encoding: null
    };

    request(requestOptions)
        .on('response', (response) => {
            if (response.statusCode !== 200) {
                console.error(`Failed to get logs: HTTP ${response.statusCode}`);
                console.log(response);
                ws.send(`Error: Failed to get logs (HTTP ${response.statusCode})`);
                ws.close();
                return;
            }

            console.log(`Started streaming logs for pod: ${podName}`);

            response.on('data', (chunk) => {
                const logMessage = chunk.toString();
                if (ws.readyState === ws.OPEN) {
                    ws.send(logMessage);
                }
            });

            response.on('end', () => {
                console.log(`Log stream ended for pod: ${podName}`);
                if (ws.readyState === ws.OPEN) {
                    ws.close();
                }
            });

            response.on('error', (err) => {
                console.error(`Error streaming logs for pod ${podName}:`, err);
                if (ws.readyState === ws.OPEN) {
                    ws.send(`Error streaming logs: ${err.message}`);
                    ws.close();
                }
            });
        })
        .on('error', (err) => {
            console.error(`Failed to initiate log stream for pod ${podName}:`, err);
            if (ws.readyState === ws.OPEN) {
                ws.send(`Failed to initiate log stream: ${err.message}`);
                ws.close();
            }
        });
}

module.exports = {
    setupPodLogs
};