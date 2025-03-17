export class Instance {
    uid: string;
    name: string;
    podName: string;
    ip: string;
    state: string;
    deployment: string;

    constructor(uid: string, name: string, podName: string, ip: string, state: string, deployment: string) {
        this.uid = uid;
        this.name = name;
        this.podName = podName;
        this.ip = ip;
        this.state = state;
        this.deployment = deployment;
    }
}

