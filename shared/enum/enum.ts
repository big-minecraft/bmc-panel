import {DeploymentTypeEnum} from "./enums/deployment-type";
import {InstanceStateEnum} from "./enums/instance-state";

export class Enum {
    // Deployments
    static DeploymentType = new DeploymentTypeEnum();
    static InstanceState = new InstanceStateEnum();
}
