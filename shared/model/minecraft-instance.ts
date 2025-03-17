import {Instance} from "./instance";

export class MinecraftInstance extends Instance {
    players: Map<string, string>;

    constructor(uid: string, name: string, podName: string, ip: string, state: string, deployment: string) {
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