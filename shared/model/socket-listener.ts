import {SocketMessageType} from "../enum/enums/socket-message-type";

export default abstract class SocketListener<T> {
    private readonly messageType: SocketMessageType;

    protected constructor(messageType: SocketMessageType) {
        this.messageType = messageType;
    }

    public abstract validateMessage(message: unknown): boolean;
    public abstract onMessage(message: T): void;

    public getMessageType(): SocketMessageType {
        return this.messageType;
    }
}