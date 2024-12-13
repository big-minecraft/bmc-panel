const request = require('request');
const { Agent } = require("https");
const fs = require('fs');
const path = require('path');

function setupPodLogs(ws, podName, cluster, user) {
    if (!podName) {
        throw new Error('Pod name is required');
    }

    // Setup log options
    const logOptions = {
        follow: true,
        tailLines: 100,
        pretty: true,
    };

    // Construct log URL
    const logUrl = `${cluster.server}/api/v1/namespaces/default/pods/${podName}/log?container=mc&follow=${logOptions.follow}&tailLines=${logOptions.tailLines}&pretty=${logOptions.pretty}`;

    // Convert base64 certificate data to buffers
    const cert = Buffer.from(user.certData, 'base64');
    const key = Buffer.from(user.keyData, 'base64');
    const ca = cluster.caData ? Buffer.from(cluster.caData, 'base64') : undefined;

    // Setup request options with client certificate authentication
    const requestOptions = {
        url: logUrl,
        method: 'GET',
        agentOptions: {
            cert: cert,
            key: key,
            ca: ca,
            rejectUnauthorized: true  // Only for development/testing
        },
        json: false,
        encoding: null
    };

    console.log('Making request with options:', {
        url: requestOptions.url,
        method: requestOptions.method,
        rejectUnauthorized: requestOptions.agentOptions.rejectUnauthorized,
        hasCert: !!requestOptions.agentOptions.cert,
        hasKey: !!requestOptions.agentOptions.key,
        hasCa: !!requestOptions.agentOptions.ca
    });

    // Create request
    const logRequest = request(requestOptions)
        .on('response', (response) => {
            console.log('Response status:', response.statusCode);

            if (response.statusCode !== 200) {
                console.error(`Failed to get logs: HTTP ${response.statusCode}`);
                if (response.statusCode === 401) {
                    console.error('Authentication failed. Check client certificates.');
                }
                ws.send(`Error: Failed to get logs (HTTP ${response.statusCode})`);
                ws.close();
                return;
            }

            console.log(`Started streaming logs for pod: ${podName}`);

            response.on('data', (chunk) => {
                try {
                    const logMessage = chunk.toString();
                    if (ws.readyState === ws.OPEN) {
                        ws.send(logMessage);
                    }
                } catch (err) {
                    console.error('Error processing log message:', err);
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

    // Handle WebSocket close
    ws.on('close', () => {
        console.log(`Client disconnected from logs and commands of pod: ${podName}`);
        if (logRequest.abort) {
            logRequest.abort();
        }
    });
}

module.exports = {
    setupPodLogs
};