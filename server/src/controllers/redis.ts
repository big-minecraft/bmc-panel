import Redis from 'ioredis';
import * as genericPool from 'generic-pool';
import config from '../config';

// Interfaces for the data structures
interface Instance {
    uid: string;
    podName: string;

    [key: string]: any; // Additional instance properties
}

interface Proxy {
    uid: string;
    podName: string;

    [key: string]: any; // Additional proxy properties
}

// Pool configuration interface
interface RedisPool extends genericPool.Pool<Redis> {
    acquire: () => Promise<Redis>;
    release: (client: Redis) => Promise<void>;
}

// Create the Redis connection pool
const redisPool: RedisPool = genericPool.createPool({
    create: (): Promise<Redis> => {
        return Promise.resolve(new Redis({
            host: config.redis.host,
            port: config.redis.port,
        }));
    },
    destroy: async (client: Redis): Promise<void> => {
        await client.quit();
        return;
    }
}, {
    max: 10,
    min: 2
}) as RedisPool;

async function getInstances(): Promise<Instance[]> {
    const client: Redis = await redisPool.acquire();
    try {
        // Fetch all instances from the hash
        const instancesData: { [key: string]: string } = await client.hgetall('instances');

        // Parse each JSON string back into an object
        return Object.entries(instancesData).map(([uid, jsonString]: [string, string]): Instance => {
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

async function getProxies(): Promise<Proxy[]> {
    const client: Redis = await redisPool.acquire();
    try {
        // Fetch all instances from the hash
        const proxiesData: { [key: string]: string } = await client.hgetall('proxies');

        // Parse each JSON string back into an object
        return Object.entries(proxiesData).map(([uid, jsonString]: [string, string]): Proxy => {
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

async function sendDeploymentUpdate(): Promise<void> {
    const client: Redis = await redisPool.acquire();
    try {
        await client.publish('deployment-modified', 'update');
    } finally {
        await redisPool.release(client);
    }
}

async function sendProxyUpdate(): Promise<void> {
    const client: Redis = await redisPool.acquire();
    try {
        await client.publish('proxy-modified', 'update');
    } finally {
        await redisPool.release(client);
    }
}

export async function setPodStatus(podName: string, status: string): Promise<void> {
    let podType: string = podName.includes('proxy') ? 'proxies' : 'instances';
    const client: Redis = await redisPool.acquire();

    const instancesData: { [key: string]: string } = await client.hgetall(podType);
    const uid = Object.keys(instancesData).find(key => {
        return JSON.parse(instancesData[key]).podName === podName;
    });

    if (uid) {
        const instance = JSON.parse(instancesData[uid]);
        instance.state = status;
        await client.hset(podType, uid, JSON.stringify(instance));
    }
}

export {
    redisPool,
    getInstances,
    getProxies,
    sendDeploymentUpdate,
    sendProxyUpdate
};
