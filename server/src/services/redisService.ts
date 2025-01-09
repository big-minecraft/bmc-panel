import Redis from 'ioredis';
import {redisPool, setPodStatus} from "../controllers/redis";
import {updatePod} from "./powerActionService";

interface ServerShutdownEvent {
    server: string;
    event: 'shutdown';
    timestamp: string;
}

export class RedisService {
    private subscriber: Redis | null = null;
    private isInitialized: boolean = false;

    public async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            this.subscriber = await redisPool.acquire();

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
                await redisPool.release(this.subscriber);
                this.subscriber = null;
            }
            console.error('Failed to initialize Redis service:', error);
            throw error;
        }
    }

    private async handleServerShutdown(event: ServerShutdownEvent) {
        console.log(`Server ${event.server} shutdown at ${event.timestamp}`);

        await setPodStatus(event.server, 'STOPPED');
        await updatePod(event.server, 'STOPPED');
    }

    public async shutdown() {
        if (this.subscriber) {
            await this.subscriber.unsubscribe('server-status');
            await redisPool.release(this.subscriber);
            this.subscriber = null;
        }
        this.isInitialized = false;
    }
}