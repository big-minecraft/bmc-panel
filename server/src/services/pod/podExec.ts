import * as K8s from '@kubernetes/client-node';
import { PassThrough, Readable, Writable } from 'stream';
import KubernetesService from '../kubernetesService';
import { ExecResult, FileOperationError, FileOperationErrorCode } from '../../types/fileSession';

const STDIN_CHANNEL = 0;
const CLOSE_CHANNEL = 255;
const CLOSE_CAPABLE_PROTOCOL = 'v5.channel.k8s.io';

const WS_BUFFER_HIGH_WATER = 4 * 1024 * 1024;
const WS_DRAIN_POLL_MS = 10;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_STDOUT_BYTES = 16 * 1024 * 1024;

export interface PodRef {
    podName: string;
    namespace: string;
    container: string;
}

export interface ExecOptions {
    stdin?: Readable;
    stdout?: Writable;
    timeoutMs?: number;
    maxStdoutBytes?: number;
}

export function shQuote(value: string): string {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}

let execClient: K8s.Exec | null = null;

function getExecClient(): K8s.Exec {
    if (!execClient) {
        execClient = new K8s.Exec(KubernetesService.getInstance().kc);
    }
    return execClient;
}

export async function execInPod(
    pod: PodRef,
    command: string[],
    options: ExecOptions = {}
): Promise<ExecResult> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxStdoutBytes = options.maxStdoutBytes ?? DEFAULT_MAX_STDOUT_BYTES;

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;

    return new Promise<ExecResult>((resolve, reject) => {
        let settled = false;
        let status: K8s.V1Status | null = null;
        let stdoutDone = false;
        let socket: any = null;
        let overflow: Error | null = null;

        let timer: NodeJS.Timeout;

        const cleanup = () => {
            clearTimeout(timer);
            options.stdin?.pause();
            try {
                socket?.close();
            } catch { }
        };

        const fail = (error: Error) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        };

        timer = setTimeout(() => {
            fail(new FileOperationError(
                `Command timed out after ${timeoutMs}ms in ${pod.podName}: ${command.join(' ')}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            ));
        }, timeoutMs);

        const maybeFinish = () => {
            if (settled || !status || !stdoutDone) return;
            settled = true;
            cleanup();

            if (overflow) {
                reject(overflow);
                return;
            }

            resolve({
                stdout: Buffer.concat(stdoutChunks),
                stderr: Buffer.concat(stderrChunks).toString('utf8'),
                exitCode: exitCodeOf(status),
            });
        };

        const stdoutSink = new Writable({
            write(chunk: Buffer, _encoding, callback) {
                if (options.stdout) {
                    const flushed = options.stdout.write(chunk);
                    callback();

                    if (!flushed && socket) {
                        socket.pause?.();
                        options.stdout.once('drain', () => socket?.resume?.());
                    }
                    return;
                }

                stdoutBytes += chunk.length;
                if (stdoutBytes > maxStdoutBytes) {
                    overflow = new FileOperationError(
                        `Command output exceeded ${maxStdoutBytes} bytes`,
                        FileOperationErrorCode.POD_EXEC_FAILED
                    );
                    callback();
                    return;
                }

                stdoutChunks.push(chunk);
                callback();
            },
        });
        stdoutSink.on('finish', () => {
            stdoutDone = true;
            maybeFinish();
        });
        stdoutSink.on('error', fail);

        const stderrSink = new Writable({
            write(chunk: Buffer, _encoding, callback) {
                stderrChunks.push(chunk);
                callback();
            },
        });

        const stdinRelay = options.stdin ? new PassThrough() : null;

        getExecClient()
            .exec(
                pod.namespace,
                pod.podName,
                pod.container,
                command,
                stdoutSink,
                stderrSink,
                stdinRelay,
                false,
                (podStatus) => {
                    status = podStatus;
                    maybeFinish();
                }
            )
            .then((ws) => {
                socket = ws;
                ws.on('error', (error: Error) => fail(error));

                ws.on('close', () => {
                    if (status) return;

                    fail(new FileOperationError(
                        `Connection to ${pod.podName} closed before the command reported a status`,
                        FileOperationErrorCode.POD_EXEC_FAILED
                    ));
                });

                if (options.stdin && stdinRelay) {
                    pumpStdin(ws, options.stdin, stdinRelay, () => settled, fail);
                }
            })
            .catch(fail);
    });
}

function pumpStdin(
    ws: any,
    source: Readable,
    relay: PassThrough,
    isSettled: () => boolean,
    onError: (error: Error) => void
): void {
    let draining = false;
    let ended = false;

    source.on('data', (chunk: Buffer) => {
        if (isSettled() || ws.readyState !== ws.OPEN) return;

        try {
            relay.write(chunk);
        } catch (error) {
            onError(error as Error);
            return;
        }

        if (draining || ws.bufferedAmount <= WS_BUFFER_HIGH_WATER) return;

        draining = true;
        source.pause();

        const poll = setInterval(() => {
            if (!isSettled() && ws.bufferedAmount > WS_BUFFER_HIGH_WATER) return;

            clearInterval(poll);
            draining = false;
            if (!isSettled()) source.resume();
        }, WS_DRAIN_POLL_MS);
    });

    source.once('error', onError);

    source.once('close', () => {
        if (ended || isSettled()) return;

        onError(new FileOperationError(
            'The upload ended before all of its data arrived',
            FileOperationErrorCode.POD_EXEC_FAILED
        ));
    });

    source.once('end', () => {
        ended = true;
        if (isSettled() || ws.readyState !== ws.OPEN) return;

        if (ws.protocol === CLOSE_CAPABLE_PROTOCOL) {
            ws.send(Buffer.from([CLOSE_CHANNEL, STDIN_CHANNEL]));
        }
    });
}

function exitCodeOf(status: K8s.V1Status): number {
    if (status.status === 'Success') return 0;

    const cause = status.details?.causes?.find(c => c.reason === 'ExitCode');
    const code = cause?.message !== undefined ? parseInt(cause.message, 10) : NaN;

    return Number.isNaN(code) ? 1 : code;
}
