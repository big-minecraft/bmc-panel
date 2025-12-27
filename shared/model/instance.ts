export interface InstanceResourceMetrics {
    cpu: {
        usage: number;          // Current CPU usage in vCPU
        request?: number;       // CPU request in vCPU
        limit?: number;         // CPU limit in vCPU
    };
    memory: {
        usage: number;          // Current memory usage in MB
        request?: number;       // Memory request in MB
        limit?: number;         // Memory limit in MB
    };
    uptime: string;            // Uptime duration string
    players: number;       // Number of active connections
}

export class Instance {
    uid: string;
    name: string;
    podName: string;
    ip: string;
    state: string;
    deployment: string;
    metrics?: InstanceResourceMetrics;

    constructor(uid: string, name: string, podName: string, ip: string, state: string, deployment: string) {
        this.uid = uid;
        this.name = name;
        this.podName = podName;
        this.ip = ip;
        this.state = state;
        this.deployment = deployment;
    }
}

