import {Server as SocketIOServer, Socket} from 'socket.io';
import { Server as HttpServer } from 'http';
import {SocketMessageType} from "../../../../../shared/enum/enums/socket-message-type";
import {Enum} from "../../../../../shared/enum/enum";
import SocketListener from "../../../../../shared/model/socket-listener";
import HandshakeAckListener from "../listeners/handshake-ack-listener";

export type SocketMessage = {
    id: string;
    data: unknown;
}

export default class SocketManager {
    private io: SocketIOServer;
    private sockets: Socket[] = [];
    private customListeners: SocketListener<unknown>[] = [];

    constructor(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
            }
        });

        this.setupSocketListeners();
        this.registerCustomListeners();
        console.log("socket.io server setup complete");
    }

    private registerCustomListeners(): void {
        this.registerCustomListener(new HandshakeAckListener());
    }

    private setupSocketListeners(): void {
        this.io.on("connection", (socket) => {
            console.log(`new connection: ${socket.id}`);

            socket.on("disconnect", () => {
                console.log(`client disconnected: ${socket.id}`);
                this.sockets = this.sockets.filter(s => s.id !== socket.id);
            });

            socket.on("message", (message: SocketMessage) => {
                this.handleMessage(socket, message);
            });

            this.sockets.push(socket);
            this.sendMessage(socket, Enum.SocketMessageType.CLIENT_HANDSHAKE, {
                hello: "hello from server"
            })
        });
    }

    private handleMessage(socket: Socket, message: SocketMessage): void {
        console.log(`message from ${socket.id}: ${JSON.stringify(message)}`);
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
                    throw new Error('message validation failed: ' + JSON.stringify(message));
                }
            }
        })
    }

    private registerCustomListener(listener: SocketListener<unknown>): void {
        this.customListeners.push(listener);
    }

    public sendAll<T>(messageType: SocketMessageType, data: T): void {
        this.sockets.forEach(socket => this.sendMessage(socket, messageType, data));
    }

    public sendMessage<T>(socket: Socket, messageType: SocketMessageType, data: T): boolean {
        const message: SocketMessage = {
            id: messageType.identifier,
            data
        };

        socket.emit('message', message);
        return true;
    }
}