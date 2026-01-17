import Redis from 'ioredis';
import * as genericPool from 'generic-pool';
import {RedisListenerService} from "./redisListenerService";
import Deployment from "../features/deployments/models/deployment";
import {MinecraftInstance} from "../../../shared/model/minecraft-instance";
import {Instance} from "../../../shared/model/instance";
import DeploymentManager from "../features/deployments/controllers/deploymentManager";
import {InstanceState} from "../../../shared/enum/enums/instance-state";
import ConfigManager from "../features/config/controllers/configManager";

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
                    host: ConfigManager.getConfig().redis.host,
                    port: ConfigManager.getConfig().redis.port,
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
        return RedisManager.instance;
    }

    public static init(): void {
        RedisManager.instance = new RedisManager();
    }

    public async getInstances(deployment: Deployment): Promise<Instance[]> {
        const client: Redis = await this.redisPool.acquire();
        try {
            let instances: Instance[] = [];
            let cursor = '0';
            const pattern = `instance:*:${deployment.name}`;

            do {
                const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern);
                cursor = nextCursor;

                if (keys.length > 0) {
                    for (const key of keys) {
                        const instanceData = await client.hgetall(key);
                        if (!instanceData || Object.keys(instanceData).length === 0) continue;

                        if (instanceData.players !== undefined) {
                            const minecraftInstance = new MinecraftInstance(
                                instanceData.uid,
                                instanceData.name,
                                instanceData.podName,
                                instanceData.ip,
                                instanceData.state,
                                instanceData.deployment
                            );

                            try {
                                const playersData = typeof instanceData.players === 'string'
                                    ? JSON.parse(instanceData.players)
                                    : instanceData.players;

                                if (typeof playersData === 'object') {
                                    Object.entries(playersData).forEach(([playerUuid, playerName]) => {
                                        minecraftInstance.addPlayer(playerUuid, playerName as string);
                                    });
                                }
                            } catch (err) {
                                console.warn(`Failed to parse players data for instance ${instanceData.uid}:`, err);
                            }

                            instances.push(minecraftInstance);
                        } else {
                            instances.push(new Instance(
                                instanceData.uid,
                                instanceData.name,
                                instanceData.podName,
                                instanceData.ip,
                                instanceData.state,
                                deployment.name
                            ));
                        }
                    }
                }
            } while (cursor !== '0');

            return instances;
        } catch (error) {
            console.error('Failed to fetch instances:', error);
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }

    public async setPodState(deploymentName: string, podName: string, state: InstanceState): Promise<void> {
        let deployment: Deployment = DeploymentManager.getDeploymentByName(deploymentName);
        if (!deployment) throw new Error('Deployment not found');
        console.log(deployment);

        let instances: Instance[] = await this.getInstances(deployment);

        let instance: Instance = instances.find(instance => instance.podName === podName);
        instance.state = state.identifier;

        const client: Redis = await this.redisPool.acquire();

        try {
            const key = `instance:${instance.uid}:${deploymentName}`;
            const instanceData: any = {
                uid: instance.uid,
                name: instance.name,
                podName: instance.podName,
                ip: instance.ip,
                state: instance.state,
                deployment: instance.deployment
            };

            if (instance instanceof MinecraftInstance) {
                instanceData.players = JSON.stringify(Object.fromEntries(instance.players));
            }

            await client.hset(key, instanceData);
        } catch (error) {
            console.error('Failed to set pod status:', error);
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }

    public async getManagerTimestamp(): Promise<number> {
        const client: Redis = await this.redisPool.acquire();
        try {
            return parseInt(await client.get("lastManagerUpdate"));
        } catch (error) {
            console.error('Failed to fetch manager timestamp:', error);
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }

    public async setDeploymentEnabled(deploymentName: string, enabled: boolean): Promise<void> {
        const client: Redis = await this.redisPool.acquire();
        try {
            const key = `deployment:${deploymentName}`;
            await client.hset(key, 'enabled', enabled ? 'true' : 'false');
        } catch (error) {
            console.error('Failed to set deployment enabled state:', error);
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }

    public async getDeploymentEnabled(deploymentName: string): Promise<boolean | null> {
        const client: Redis = await this.redisPool.acquire();
        try {
            const key = `deployment:${deploymentName}`;
            const enabled = await client.hget(key, 'enabled');
            if (enabled === null) return null;
            return enabled === 'true';
        } catch (error) {
            console.error('Failed to get deployment enabled state:', error);
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }

    public async sendRestartMessage(deploymentName: string): Promise<void> {
        const client: Redis = await this.redisPool.acquire();
        try {
            await client.publish('DEPLOYMENT_RESTART', deploymentName);
        } catch (error) {
            console.error('Failed to send restart message:', error);
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }

    public async syncDeploymentToRedis(deploymentName: string, enabled: boolean): Promise<void> {
        await this.setDeploymentEnabled(deploymentName, enabled);
    }
}

export default RedisManager;