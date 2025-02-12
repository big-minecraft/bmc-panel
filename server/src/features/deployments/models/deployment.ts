export interface Deployment {
    name: string;
    path: string;
    enabled: boolean;
    dataDirectory: string;
    type: 'persistent' | 'scalable';
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

export interface DeploymentYaml {
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