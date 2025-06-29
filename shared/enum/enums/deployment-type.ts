import {CustomEnum, EnumValue} from "../custom-enum";

export class DeploymentTypeEnum extends CustomEnum<DeploymentType> {
    constructor() {
        super();
    }

    public PROXY = this.addValue(new DeploymentType('Proxy', 'proxy', 'mc'));
    public PERSISTENT = this.addValue(new DeploymentType('Persistent', 'persistent', 'mc'));
    public SCALABLE = this.addValue(new DeploymentType('Scalable', 'scalable', 'mc'));
    public PROCESS = this.addValue(new DeploymentType('Process', 'process', 'process'));

    public fromString(identifier: string) {
        for (let deploymentType of this.values()) if (deploymentType.identifier === identifier) return deploymentType;
        return null;
        //Test comment
    }

    public fromPath(path: string) {
        for (let deploymentType of this.values()) if (path.includes(`/${deploymentType.identifier}/`)) return deploymentType;
        return null;
    }
}

export class DeploymentType extends EnumValue {
    public displayName: string;
    public identifier: string;
    public containerName: string;

    constructor(displayName: string, identifier: string, containerName: string) {
        super();
        this.displayName = displayName;
        this.identifier = identifier;
        this.containerName = containerName;
    }
}
