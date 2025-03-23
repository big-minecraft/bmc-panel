import SocketListener from "../../../../../shared/model/socket-listener";
import {Enum} from "../../../../../shared/enum/enum";
import {z} from "zod";

const schema = z.object({
    helloResponse: z.string(),
}).strict();

export type HandshakeAck = z.infer<typeof schema>;

export default class HandshakeAckListener extends SocketListener<HandshakeAck> {
    constructor() {
        super(Enum.SocketMessageType.SERVER_HANDSHAKE_ACK);
    }

    validateMessage(message: unknown): boolean {
        return schema.safeParse(message).success;
    }

    onMessage(message: HandshakeAck): void {
        console.log(message.helloResponse);
    }
}