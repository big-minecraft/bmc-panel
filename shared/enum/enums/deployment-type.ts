import {CustomEnum, EnumValue} from "../custom-enum";

export class DeploymentTypeEnum extends CustomEnum<DeploymentType> {
    constructor() {
        super();
    }

    public PERSISTENT = this.addValue(new DeploymentType('Persistent', 'persistent'));
    public SCALABLE = this.addValue(new DeploymentType('Scalable', 'scalable'));

    public getFromString(identifier: string) {
        for (let deploymentType of this.values()) if (deploymentType.identifier === identifier) return deploymentType;
        return null;
    }
}

export class DeploymentType extends EnumValue {
    public displayName: string;
    public identifier: string;

    constructor(displayName: string, identifier: string) {
        super();
        this.displayName = displayName;
        this.identifier = identifier;
    }
}
