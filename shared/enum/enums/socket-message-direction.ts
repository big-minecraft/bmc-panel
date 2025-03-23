import {CustomEnum, EnumValue} from "../custom-enum";

export class SocketMessageDirectionEnum extends CustomEnum<SocketMessageDirection> {
    constructor() {
        super();
    }

    public CLIENT_BOUND = this.addValue(new SocketMessageDirection('CLIENT_BOUND'));
    public SERVER_BOUND = this.addValue(new SocketMessageDirection('SERVER_BOUND'));

    public fromString(identifier: string) {
        for (let deploymentType of this.values()) if (deploymentType.identifier === identifier) return deploymentType;
        return null;
    }
}

export class SocketMessageDirection extends EnumValue {
    public identifier: string;

    constructor(identifier: string) {
        super();
        this.identifier = identifier;
    }
}
