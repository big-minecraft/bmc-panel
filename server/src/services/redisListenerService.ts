import Redis from 'ioredis';
import {updatePod, updateStateForClients} from "./powerActionService";
import RedisService, {RedisManager} from "./redisService";
import {Enum} from "../../../shared/enum/enum";
import {InstanceState} from "../../../shared/enum/enums/instance-state";

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
        if (this.isInitialized) return;

        try {
            this.subscriber = await this.redisService.redisPool.acquire();
            this.setupPowerActionListener();
        } catch (error) {
            if (this.subscriber) {
                await this.redisService.redisPool.release(this.subscriber);
                this.subscriber = null;
            }
            console.error('Failed to initialize Redis service:', error);
            throw error;
        }

        this.isInitialized = true;
    }

    private async setupPowerActionListener() {
        await this.subscriber.subscribe('server-status', (err, count) => {
            if (err) {
                console.error('Failed to subscribe:', err);
                return;
            }
        });

        await this.subscriber.subscribe('instance-state-change', (err, count) => {
           if (err) {
                console.error('Failed to subscribe to instance-state-change:', err);
                return;
           }
        });

        this.subscriber.on('message', (channel: string, message: string) => {
            if (channel === 'server-status') {
                try {
                    const event: ServerShutdownEvent = JSON.parse(message);
                    this.handleServerShutdownEvent(event);
                } catch (error) {
                    console.error('Error parsing server shutdown message:', error);
                }
            } else if (channel === 'instance-state-change') {
                console.log("INSTANCE STATE DEBUG :" + message);

                try {
                    let parts = message.split(':');
                    let ipAddress = parts[0];
                    let state = Enum.InstanceState.fromString(parts[1]);

                    RedisService.getInstance().getInstanceFromIp(ipAddress).then((instance) => {
                        updateStateForClients(instance.podName, state);
                    });

                } catch (error) {
                    console.error('Error parsing instance state change message:', error);
                }
            }
        });
    }

    private async handleServerShutdownEvent(event: ServerShutdownEvent) {
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