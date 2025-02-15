import {DeploymentType} from "../../../../../shared/enum/enums/deployment-type";

export interface DeploymentValues {
    volume: {
        dataDirectory?: string;
    };
    dedicatedNode?: string;
    scaling: {
        minInstances?: number;
    };
    queuing: {
        requireStartupConfirmation?: string;
    };
}

export interface Manifest {
    name: string;
    path: string;
    content: DeploymentValues;
    isEnabled: boolean;
    type: DeploymentType;
}