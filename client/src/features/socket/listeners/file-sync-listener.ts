import {z} from "zod";
import SocketListener from "../../../../../shared/model/socket-listener.ts";
import {Enum} from "../../../../../shared/enum/enum.ts";

const schema = z.object({
    event: z.string(),
    success: z.boolean(),
    timestamp: z.string(),
    details: z.string(),
}).strict();

export type FileSync = z.infer<typeof schema>;

let syncInProgress = false;

export default class FileSyncListener extends SocketListener<FileSync> {

    constructor() {
        super(Enum.SocketMessageType.CLIENT_FILE_SYNC);
    }

    validateMessage(message: unknown): boolean {
        return schema.safeParse(message).success;
    }

    onMessage(message: FileSync): void {

        if(message.event === "sync_started") {
            syncInProgress = true;
        } else if (message.event === "sync_completed") {
            syncInProgress = false;
        }
    }
}

export {syncInProgress};