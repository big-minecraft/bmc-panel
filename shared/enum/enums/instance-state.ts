import {CustomEnum, EnumValue} from "../custom-enum";

export class InstanceStateEnum extends CustomEnum<InstanceState> {
    constructor() {
        super();
    }

    public STARTING = this.addValue(new InstanceState('Starting Up', 'STARTING', 'text-yellow-500'));
    public RUNNING = this.addValue(new InstanceState('Online', 'RUNNING', 'text-green-500'));
    public BLOCKED = this.addValue(new InstanceState('Blocked', 'BLOCKED', 'text-red-500'));
    public STOPPING = this.addValue(new InstanceState('Shutting Down', 'STOPPING', 'text-orange-500'));
    public STOPPED = this.addValue(new InstanceState('Offline', 'STOPPED', 'text-gray-500'));

    public fromString(identifier: string) {
        for (let deploymentType of this.values()) if (deploymentType.identifier === identifier) return deploymentType;
        return null;
    }
}

export class InstanceState extends EnumValue {
    public identifier: string;
    public displayName: string;
    public color: string;

    constructor(displayName: string, identifier: string, color: string) {
        super();
        this.identifier = identifier;
        this.displayName = displayName;
        this.color = color;
    }
}
