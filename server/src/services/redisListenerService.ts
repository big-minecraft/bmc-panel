import Redis from 'ioredis';
import {updatePod} from "./powerActionService";
import {RedisManager} from "./redisService";
import {Enum} from "../../../shared/enum/enum";

interface ServerShutdownEvent {
    server: string;
    deployment: string;
    event: 'shutdown';
    timestamp: string;
}

export class RedisListenerService {
    private subscriber: Redis | null = null;
    private isInitialized: boolean = false;
    private redisService: RedisManager;

    public constructor(redisService: RedisManager) {
        this.redisService = redisService
    }

    public async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            this.subscriber = await this.redisService.redisPool.acquire();

            await this.subscriber.subscribe('server-status', (err, count) => {
                if (err) {
                    console.error('Failed to subscribe:', err);
                    return;
                }
            });

            this.subscriber.on('message', (channel: string, message: string) => {
                if (channel === 'server-status') {
                    try {
                        const event: ServerShutdownEvent = JSON.parse(message);
                        this.handleServerShutdown(event);
                    } catch (error) {
                        console.error('Error parsing server shutdown message:', error);
                    }
                }
            });

            this.isInitialized = true;
        } catch (error) {
            if (this.subscriber) {
                await this.redisService.redisPool.release(this.subscriber);
                this.subscriber = null;
            }
            console.error('Failed to initialize Redis service:', error);
            throw error;
        }
    }

    private async handleServerShutdown(event: ServerShutdownEvent) {
        console.log(`Server ${event.server} shutdown at ${event.timestamp}`);

        await this.redisService.setPodState(event.deployment, event.server, Enum.InstanceState.STOPPED);
        await updatePod(event.deployment, event.server, Enum.InstanceState.STOPPED);
    }

    public async shutdown() {
        if (this.subscriber) {
            await this.subscriber.unsubscribe('server-status');
            await this.redisService.redisPool.release(this.subscriber);
            this.subscriber = null;
        }
        this.isInitialized = false;
    }
}