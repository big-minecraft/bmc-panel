import { io, Socket } from 'socket.io-client';
import { SocketMessageType } from "../../../../../shared/enum/enums/socket-message-type";
import { Enum } from "../../../../../shared/enum/enum";
import SocketListener from "../../../../../shared/model/socket-listener";

export type SocketMessage = {
    id: string;
    data: unknown;
}

export default class ClientSocket {
    private url: string;
    private socket: Socket | null = null;
    private connected: boolean = false;
    private connectListeners: (() => void)[] = [];
    private disconnectListeners: (() => void)[] = [];
    private customListeners: SocketListener<unknown>[] = [];

    constructor(url: string) {
        this.url = url;
    }

    public connect(): this {
        this.socket = io(this.url);

        this.socket.on('connect', () => {
            console.log("connected to socket server")
            this.connected = true;
            this.notifyConnectListeners();
        });

        this.socket.on('disconnect', () => {
            console.log("disconnected from socket server")
            this.connected = false;
            this.notifyDisconnectListeners();
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
            this.notifyDisconnectListeners();
        }
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public onConnect(listener: () => void): void {
        this.connectListeners.push(listener);
        if (this.connected) listener();
    }

    public onDisconnect(listener: () => void): void {
        this.disconnectListeners.push(listener);
    }

    private notifyConnectListeners(): void {
        this.connectListeners.forEach(listener => listener());
    }

    private notifyDisconnectListeners(): void {
        this.disconnectListeners.forEach(listener => listener());
    }

    private handleMessage(message: SocketMessage): void {
        if (!message || !message.id) {
            console.error(`received invalid message format: ${JSON.stringify(message)}`)
            return;
        }

        const messageType: SocketMessageType = Enum.SocketMessageType.fromString(message.id);

        const matchingListeners = this.customListeners.filter(listener => listener.getMessageType() === messageType);
        matchingListeners.forEach(listener => {
            if (listener.validateMessage(message.data)) {
                listener.onMessage(message.data);
            } else {
                console.error('message validation failed: ' + JSON.stringify(message))
            }
        });
    }

    public registerCustomListener(listener: SocketListener<unknown>): void {
        this.customListeners.push(listener);
    }

    public unregisterCustomListener(listener: SocketListener<unknown>): void {
        this.customListeners = this.customListeners.filter(l => l !== listener);
    }

    public sendMessage<T>(messageType: SocketMessageType, data: T): boolean {
        if (!this.connected || !this.socket) {
            console.log(`cannot send message: not connected`)
            return false;
        }

        const message: SocketMessage = {
            id: messageType.identifier,
            data
        };

        this.socket.emit('message', message);
        console.log(`sent message: ${JSON.stringify(message)}`)
        return true;
    }
}