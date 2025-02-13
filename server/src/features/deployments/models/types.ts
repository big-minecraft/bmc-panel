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

export interface Manifest {
    name: string;
    path: string;
    content: DeploymentValues;
    isEnabled: boolean;
    type: DeploymentType;
}