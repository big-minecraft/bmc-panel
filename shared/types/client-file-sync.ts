import {z} from "zod";

const schema = z.object({
    event: z.string(),
    success: z.boolean(),
    timestamp: z.string(),
}).strict();

export type ClientFileSync = z.infer<typeof schema>;