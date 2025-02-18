import {Instance} from "./instance";
import {InstanceState} from "../enum/enums/instance-state";

export class MinecraftInstance extends Instance {
    players: Map<string, string>;

    constructor(uid: string, name: string, podName: string, ip: number, state: InstanceState, deployment: string) {
        super(uid, name, podName, ip, state, deployment);

        this.players = new Map<string, string>();
    }

    public addPlayer(uuid: string, username: string): void {
        this.players.set(uuid, username);
    }

    public getPlayers(): Map<string, string> {
        return this.players;
    }
}