import Redis from 'ioredis';
import * as genericPool from 'generic-pool';
import config from '../config';
import {RedisService} from "../services/redisService";

interface Instance {
    uid: string;
    podName: string;

    [key: string]: any;
}

interface Proxy {
    uid: string;
    podName: string;

    [key: string]: any;
}

interface RedisPool extends genericPool.Pool<Redis> {
    acquire: () => Promise<Redis>;
    release: (client: Redis) => Promise<void>;
}

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

const redisService = new RedisService();
redisService.initialize().then(r => {
    console.log('Redis service initialized');
});

async function getInstances(): Promise<Instance[]> {
    const client: Redis = await redisPool.acquire();
    try {
        const instancesData: { [key: string]: string } = await client.hgetall('instances');

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
        const proxiesData: { [key: string]: string } = await client.hgetall('proxies');

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

    try {
        const instancesData: { [key: string]: string } = await client.hgetall(podType);
        const uid = Object.keys(instancesData).find(key => {
            return JSON.parse(instancesData[key]).podName === podName;
        });

        if (uid) {
            const instance = JSON.parse(instancesData[uid]);
            instance.state = status;
            await client.hset(podType, uid, JSON.stringify(instance));
        }
    } catch (error) {
        console.error('Failed to set pod status:', error);
        throw error
    } finally {
        await redisPool.release(client);
    }
}

export {
    redisPool,
    getInstances,
    getProxies,
    sendDeploymentUpdate,
    sendProxyUpdate
};
