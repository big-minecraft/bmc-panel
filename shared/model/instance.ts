import {InstanceState} from "../enum/enums/instance-state";

export class Instance {
    uid: string;
    name: string;
    podName: string;
    ip: number;
    state: InstanceState;
    deployment: string;

    constructor(uid: string, name: string, podName: string, ip: number, state: InstanceState, deployment: string) {
        this.uid = uid;
        this.name = name;
        this.podName = podName;
        this.ip = ip;
        this.state = state;
        this.deployment = deployment;
    }
}

