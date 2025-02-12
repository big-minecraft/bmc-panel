import {promises as fs} from "fs";
import {exec} from "child_process";
import {Readable} from "node:stream";
import {promisify} from "util";

export default class Util {
    public static async safelyExecuteShellCommand(command: string): Promise<{ stdout: string; stderr: string }> {
        try {
            const { stdout, stderr } = await promisify(exec)(command);
            console.log("successfully executed command " + command)
            return { stdout, stderr };
        } catch (error) {
            throw new Error(`Command '${command}' failed: ${error.message}`);
        }
    }

    public static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.readFile(filePath);
            return true;
        } catch {
            return false;
        }
    }
}