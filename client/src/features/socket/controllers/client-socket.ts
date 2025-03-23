import { io, Socket } from 'socket.io-client';
import { SocketMessageType } from "../../../../../shared/enum/enums/socket-message-type.ts";
import { Enum } from "../../../../../shared/enum/enum.ts";
import SocketListener from "../../../../../shared/model/socket-listener.ts";

export type SocketMessage = {
    id: string;
    data: unknown;
}

export default class ClientSocket {
    private socket: Socket | null = null;
    private connected: boolean = false;
    private customListeners: SocketListener<unknown>[] = [];
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    public connect(): this {
        this.socket = io(this.url);

        this.socket.on('connect', () => {
            console.log("connected to socket server");
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log("disconnected from socket server");
            this.connected = false;
        });

        this.socket.on('message', (message: SocketMessage) => {
            this.handleMessage(message);
        });

        return this;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    private handleMessage(message: SocketMessage): void {
        if (!message || !message.id) {
            console.error(`received invalid message format: ${JSON.stringify(message)}`);
            return;
        }

        const messageType: SocketMessageType = Enum.SocketMessageType.fromString(message.id);

        this.customListeners.forEach(listener => {
            if (listener.getMessageType() === messageType) {
                if (listener.validateMessage(message.data)) {
                    listener.onMessage(message.data);
                } else {
                    console.error('message validation failed: ' + JSON.stringify(message));
                }
            }
        });
    }

    public registerCustomListener(listener: SocketListener<unknown>): void {
        this.customListeners.push(listener);
    }

    public sendMessage<T>(messageType: SocketMessageType, data: T): boolean {
        if (!this.connected || !this.socket) {
            console.log(`cannot send message: not connected`);
            return false;
        }

        const message: SocketMessage = {
            id: messageType.identifier,
            data
        };

        this.socket.emit('message', message);
        return true;
    }
}