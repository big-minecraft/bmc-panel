import Redis from 'ioredis';
import * as genericPool from 'generic-pool';
import config from '../config';
import {RedisListenerService} from "./redisListenerService";
import Deployment from "../features/deployments/models/deployment";
import {MinecraftInstance} from "../../../shared/model/minecraft-instance";
import {Instance} from "../../../shared/model/instance";
import DeploymentManager from "../features/deployments/controllers/deploymentManager";
import {InstanceState} from "../../../shared/enum/enums/instance-state";

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

    public async getInstances(deployment: Deployment): Promise<Instance[]> {
        const client: Redis = await this.redisPool.acquire();
        try {
            let instances: Instance[] = [];

            const instancesData: { [key: string]: string } = await client.hgetall(deployment.name);

            let deploymentInstances = Object.entries(instancesData).map(([uid, jsonString]: [string, string]): Instance => {
                const instanceData = JSON.parse(jsonString);

                if (instanceData.players !== undefined) {
                    const minecraftInstance = new MinecraftInstance(
                        uid,
                        instanceData.name,
                        instanceData.podName,
                        instanceData.ip,
                        instanceData.state,
                        deployment.name
                    );

                    if (typeof instanceData.players === 'object') {
                        Object.entries(instanceData.players).forEach(([playerUuid, playerName]) => {
                            minecraftInstance.addPlayer(playerUuid, playerName as string);
                        });
                    }

                    return minecraftInstance;
                } else {
                    return new Instance(
                        uid,
                        instanceData.name,
                        instanceData.podName,
                        instanceData.ip,
                        instanceData.state,
                        deployment.name
                    );
                }
            });

            instances = instances.concat(deploymentInstances);
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
        let instances: Instance[] = await this.getInstances(deployment);

        let instance: Instance = instances.find(instance => instance.podName === podName);
        instance.state = state.identifier;

        const client: Redis = await this.redisPool.acquire();

        try {
            await client.hset(deploymentName, instance.uid, JSON.stringify(instance));
        } catch (error) {
            console.error('Failed to set pod status:', error);
            throw error;
        } finally {
            await this.redisPool.release(client);
        }
    }
}

export default RedisManager.getInstance();