import Redis from 'ioredis';
import * as genericPool from 'generic-pool';
import config from '../config';
import {RedisListenerService} from "./redisListenerService";

export interface Instance {
    uid: string;
    podName: string;
    [key: string]: any;
}

export interface Proxy {
    uid: string;
    podName: string;
    [key: string]: any;
}

export interface Process {
    uid: string;
    podName: string;
    [key: string]: any;
}

interface RedisPool extends genericPool.Pool<Redis> {
    acquire: () => Promise<Redis>;
    release: (client: Redis) => Promise<void>;
}

export class RedisManager {
    private static instance: RedisManager;
    public redisPool: RedisPool;
    private redisListenerService: RedisListenerService;

    private constructor() {
        this.redisPool = genericPool.createPool({
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

        this.redisListenerService = new RedisListenerService(this);
        this.redisListenerService.initialize().then(() => {
            console.log('Redis service initialized');
        });
    }

    public static getInstance(): RedisManager {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager();
        }
        return RedisManager.instance;
    }

    public async getInstances(): Promise<Instance[]> {
        const client: Redis = await this.redisPool.acquire();
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
            await this.redisPool.release(client);
        }
    }

    public async getProxies(): Promise<Proxy[]> {
        const client: Redis = await this.redisPool.acquire();
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
            await this.redisPool.release(client);
        }
    }

    public async getProcesses(): Promise<Process[]> {
        const client: Redis = await this.redisPool.acquire();
        try {
            const processData: { [key: string]: string } = await client.hgetall('processes');

            return Object.entries(processData).map(([uid, jsonString]: [string, string]): Proxy => {
                const process = JSON.parse(jsonString);
                return {
                    uid,
                    ...process
                };
            });
        } catch (error) {
            console.error('Failed to fetch process:', error);
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }

    public async setPodStatus(podName: string, status: string): Promise<void> {
        let podType: string = podName.includes('proxy') ? 'proxies' : 'instances';
        const client: Redis = await this.redisPool.acquire();

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
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }
}

export default RedisManager.getInstance();