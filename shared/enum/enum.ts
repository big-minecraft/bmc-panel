import {DeploymentTypeEnum} from "./enums/deployment-type";
import {InstanceStateEnum} from "./enums/instance-state";
import {SocketMessageTypeEnum} from "./enums/socket-message-type";
import {SocketMessageDirectionEnum} from "./enums/socket-message-direction";

export class Enum {
    // Deployments
    static DeploymentType = new DeploymentTypeEnum();
    static InstanceState = new InstanceStateEnum();
    static SocketMessageDirection = new SocketMessageDirectionEnum();
    static SocketMessageType = new SocketMessageTypeEnum();
}
