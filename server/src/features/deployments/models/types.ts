import {DeploymentType} from "../../../../../shared/enum/enums/deployment-type";

export interface DeploymentValues {
    volume: {
        dataDirectory?: string;
    };
    scaling: {
        minInstances?: number;
    };
    queuing: {
        requireStartupConfirmation?: string;
    };
    sftpPort?: number;
}

export interface Manifest {
    name: string;
    path: string;
    content: DeploymentValues;
    isEnabled: boolean;
    sftpPort?: number;
    type: DeploymentType;
}