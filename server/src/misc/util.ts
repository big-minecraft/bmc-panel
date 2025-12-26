import { promises as fs } from "fs";

export default class Util {
    public static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.stat(filePath);
            return true;
        } catch {
            return false;
        }
    }
}