const request = require('request');
const fs = require('fs');
const path = require('path');
const kubernetesClient = require('../controllers/k8s.js');

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

    // Set up request options based on environment
    const requestOptions = {
        url: logUrl,
        method: 'GET',
        json: false,
        encoding: null
    };

    if (kubernetesClient.isRunningInCluster()) {
        console.log('running in cluster environment')
        const tokenPath = path.join('/host-root', user.authProvider.config.tokenFile);
        const caPath = path.join('/host-root', cluster.caFile);

        const token = fs.readFileSync(tokenPath, 'utf8');
        const ca = fs.readFileSync(caPath);

        requestOptions.headers = {
            'Authorization': `Bearer ${token}`
        };
        requestOptions.agentOptions = {
            ca: ca,
            rejectUnauthorized: !cluster.skipTLSVerify
        };
    } else {
        // Development environment setup
        console.log('running in development environment')
        const cert = Buffer.from(user.certData, 'base64');
        const key = Buffer.from(user.keyData, 'base64');
        const ca = cluster.caData ? Buffer.from(cluster.caData, 'base64') : undefined;

        requestOptions.agentOptions = {
            cert: cert,
            key: key,
            ca: ca,
            rejectUnauthorized: true
        };
    }

    // console.log('Making request with options:', {
    //     url: requestOptions.url,
    //     method: requestOptions.method,
    //     rejectUnauthorized: requestOptions.agentOptions?.rejectUnauthorized,
    //     hasCert: !!requestOptions.agentOptions?.cert,
    //     hasKey: !!requestOptions.agentOptions?.key,
    //     hasCa: !!requestOptions.agentOptions?.ca,
    //     hasToken: !!requestOptions.headers?.Authorization
    // });

    const logRequest = request(requestOptions)
        .on('response', (response) => {
            console.log('response status:', response.statusCode)

            if (response.statusCode !== 200) {
                console.error(`failed to get logs: HTTP ${response.statusCode}`)
                if (response.statusCode === 401) {
                    console.error('authentication failed. check credentials')
                }
                ws.send(`Error: Failed to get logs (HTTP ${response.statusCode})`);
                ws.close();
                return;
            }

            console.log(`started streaming logs for pod: ${podName}`)

            response.on('data', (chunk) => {
                try {
                    const logMessage = chunk.toString();
                    if (ws.readyState === ws.OPEN) {
                        ws.send(logMessage);
                    }
                } catch (err) {
                    console.error('error processing log message:', err);
                }
            });

            response.on('end', () => {
                console.log(`log stream ended for pod: ${podName}`)
                if (ws.readyState === ws.OPEN) {
                    ws.close();
                }
            });

            response.on('error', (err) => {
                console.error(`error streaming logs for pod ${podName}:`, err)
                if (ws.readyState === ws.OPEN) {
                    ws.send(`Error streaming logs: ${err.message}`);
                    ws.close();
                }
            });
        })
        .on('error', (err) => {
            console.error(`failed to initiate log stream for pod ${podName}:`, err)
            if (ws.readyState === ws.OPEN) {
                ws.send(`Failed to initiate log stream: ${err.message}`);
                ws.close();
            }
        });

    ws.on('close', () => {
        console.log(`client disconnected from logs and commands of pod: ${podName}`)
        if (logRequest.abort) {
            logRequest.abort();
        }
    });
}

module.exports = {
    setupPodLogs
};