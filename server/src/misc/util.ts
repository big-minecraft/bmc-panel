import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default class Util {
    public static async safelyExecuteShellCommand(command: string): Promise<{ stdout: string; stderr: string }> {
        try {
            const { stdout, stderr } = await execAsync(command);
            console.log(`Successfully executed: ${command}`);
            return { stdout, stderr };
        } catch (error: any) {

            const capturedStdout = error.stdout?.trim() || "No stdout";
            const capturedStderr = error.stderr?.trim() || "No stderr";

            const detailedErrorMessage = [
                `Command failed: ${command}`,
                `Exit Code: ${error.code}`,
                `Stderr: ${capturedStderr}`,
                `Stdout: ${capturedStdout}`
            ].join('\n');

            throw new Error(detailedErrorMessage);
        }
    }

    public static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.stat(filePath);
            return true;
        } catch {
            return false;
        }
    }
}