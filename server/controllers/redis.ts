const Redis = require('ioredis');
const genericPool = require('generic-pool');
const config = require('../config');

const redisPool = genericPool.createPool({
    create: () => {
        return new Redis({
            host: config.redis.host,
            port: config.redis.port,
        });
    },
    destroy: (client) => {
        return client.quit();
    }
}, {
    max: 10,
    min: 2
});

async function getInstances() {
    const client = await redisPool.acquire();
    try {
        // Fetch all instances from the hash
        const instancesData = await client.hgetall('instances');

        // Parse each JSON string back into an object
        return Object.entries(instancesData).map(([uid, jsonString]) => {
            const instance = JSON.parse(jsonString);
            return {
                uid,
                ...instance
            };
        });
    } catch (error) {
        console.error('Failed to fetch instances:', error);
        throw error;
    } finally {
        await redisPool.release(client);
    }
}

async function getProxies() {
    const client = await redisPool.acquire();
    try {
        // Fetch all instances from the hash
        const proxiesData = await client.hgetall('proxies');

        // Parse each JSON string back into an object
        return Object.entries(proxiesData).map(([uid, jsonString]) => {
            const proxy = JSON.parse(jsonString);
            return {
                uid,
                ...proxy
            };
        });
    } catch (error) {
        console.error('Failed to fetch proxies:', error);
        throw error;
    } finally {
        await redisPool.release(client);
    }
}

async function sendDeploymentUpdate() {
    const client = await redisPool.acquire();
    client.publish('deployment-modified', 'update');
    await redisPool.release(client);
}

async function sendProxyUpdate() {
    const client = await redisPool.acquire();
    client.publish('proxy-modified', 'update');
    await redisPool.release(client);
}

module.exports = {
    redisPool,
    getInstances,
    getProxies,
    sendDeploymentUpdate: sendDeploymentUpdate,
    sendProxyUpdate
}