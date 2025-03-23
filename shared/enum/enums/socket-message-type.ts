import {CustomEnum, EnumValue} from "../custom-enum";
import {SocketMessageDirection} from "./socket-message-direction";
import {Enum} from "../enum";

export class SocketMessageTypeEnum extends CustomEnum<SocketMessageType> {
    constructor() {
        super();
    }

    public CLIENT_HANDSHAKE = this.addValue(new SocketMessageType('CLIENT_HANDSHAKE', Enum.SocketMessageDirection.CLIENT_BOUND));
    public SERVER_HANDSHAKE_ACK = this.addValue(new SocketMessageType('SERVER_HANDSHAKE_ACK', Enum.SocketMessageDirection.SERVER_BOUND));

    public fromString(identifier: string) {
        for (let deploymentType of this.values()) if (deploymentType.identifier === identifier) return deploymentType;
        return null;
    }
}

export class SocketMessageType extends EnumValue {
    public identifier: string;
    public direction: SocketMessageDirection;

    constructor(identifier: string, direction: SocketMessageDirection) {
        super();
        this.identifier = identifier;
        this.direction = direction;
    }
}
