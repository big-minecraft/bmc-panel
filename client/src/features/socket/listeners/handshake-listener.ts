// import {z} from "zod";
// import SocketListener from "../../../../../shared/model/socket-listener.ts";
// import {Enum} from "../../../../../shared/enum/enum.ts";
// import SocketService from "../controllers/socket-service.ts";
//
// const schema = z.object({
//     hello: z.string(),
// }).strict();
//
// export type Handshake = z.infer<typeof schema>;
//
// export default class HandshakeListener extends SocketListener<Handshake> {
//     constructor() {
//         super(Enum.SocketMessageType.CLIENT_HANDSHAKE);
//     }
//
//     validateMessage(message: unknown): boolean {
//         return schema.safeParse(message).success;
//     }
//
//     onMessage(message: Handshake): void {
//         console.log(message.hello);
//
//         SocketService.getSocket().sendMessage(Enum.SocketMessageType.SERVER_HANDSHAKE_ACK, {
//             helloResponse: "hello from client"
//         });
//     }
// }