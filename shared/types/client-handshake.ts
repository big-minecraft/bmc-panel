import {z} from "zod";

const schema = z.object({
    hello: z.string(),
}).strict();

export type ClientHandshake = z.infer<typeof schema>;