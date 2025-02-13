export interface DeploymentData {
    name: string;
    path: string;
    enabled: boolean;
    dataDirectory: string;
    type: DeploymentType;
}

export interface DeploymentPaths {
    persistent: {
        enabled: string;
        disabled: string;
    };
    nonPersistent: {
        enabled: string;
        disabled: string;
    };
}

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

export const DEPLOYMENT_TYPES = ['persistent', 'scalable'] as const;
export type DeploymentType = typeof DEPLOYMENT_TYPES[number];

export const isDeploymentType = (type: string): type is DeploymentType => {
    return DEPLOYMENT_TYPES.includes(type as DeploymentType);
};

export interface Manifest {
    name: string;
    path: string;
    content: DeploymentValues;
    isEnabled: boolean;
    type: DeploymentType;
}