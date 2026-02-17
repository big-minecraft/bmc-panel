import {CustomEnum, EnumValue} from "../custom-enum";

export type ScalableKind = 'Deployment' | 'StatefulSet'

export class DeploymentTypeEnum extends CustomEnum<DeploymentType> {
    constructor() {
        super();
    }

    public PROXY = this.addValue(new DeploymentType('Proxy', 'proxy', 'server', 'Deployment'));
    public PERSISTENT = this.addValue(new DeploymentType('Persistent', 'persistent', 'server', 'StatefulSet'));
    public SCALABLE = this.addValue(new DeploymentType('Scalable', 'scalable', 'server', 'Deployment'));
    public PROCESS = this.addValue(new DeploymentType('Process', 'process', null, 'Deployment'));

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
    public k8sResourceName: ScalableKind;

    constructor(displayName: string, identifier: string, containerName: string, k8sResourceName: ScalableKind) {
        super();
        this.displayName = displayName;
        this.identifier = identifier;
        this.containerName = containerName;
        this.k8sResourceName = k8sResourceName;
    }
}
