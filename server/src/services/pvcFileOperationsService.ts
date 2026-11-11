import { Readable, Writable } from 'stream';
import * as path from 'path';
import {
    FileEditSession,
    FileMetadata,
    FileOperationError,
    FileOperationErrorCode,
    FileSpec,
} from '../types/fileSession';
import FileSessionService from './fileSessionService';
import { ExecOptions, execInPod, PodRef, shQuote } from './pod/podExec';
import {
    archiveBaseName,
    detectArchiveFormat,
    SUPPORTED_ARCHIVE_EXTENSIONS,
    unsafeEntries,
} from './pod/archiveFormats';

const FILE_EDITOR_CONTAINER = 'file-editor';
const SESSION_ROOT = '/minecraft';

const STAT_FORMAT = '%s|%Y|%F|%a|%n';

const LIST_TIMEOUT_MS = 30_000;
const ARCHIVE_TIMEOUT_MS = 60 * 60_000;

const KEEPALIVE_MS = 60_000;

interface StatLine {
    size: number;
    modifyTime: number;
    description: string;
    octalPermissions: string;
    path: string;
}

export default class PVCFileOperationsService {
    private static instance: PVCFileOperationsService;

    public static getInstance(): PVCFileOperationsService {
        return PVCFileOperationsService.instance;
    }

    public static init(): void {
        PVCFileOperationsService.instance = new PVCFileOperationsService();
        console.log('PVCFileOperationsService initialized');
    }

    public async listFiles(sessionId: string, dirPath: string): Promise<FileMetadata[]> {
        const pod = await this.podFor(sessionId);
        const dir = this.resolvePath(dirPath);

        const result = await this.run(pod, [
            'sh', '-c',
            `find ${shQuote(dir)} -maxdepth 1 -mindepth 1 -exec stat -c ${shQuote(STAT_FORMAT)} {} \\;`,
        ], { timeoutMs: LIST_TIMEOUT_MS });

        if (result.exitCode !== 0) {
            if (result.stderr.includes('No such file or directory')) {
                throw new FileOperationError(
                    `Directory ${dir} not found`,
                    FileOperationErrorCode.FILE_NOT_FOUND
                );
            }
            throw new FileOperationError(
                `Failed to list ${dir}: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }

        return this.parseStatLines(result.stdout.toString('utf8')).map(line => this.toMetadata(line));
    }

    public async readTextFile(
        sessionId: string,
        filePath: string,
        maxBytes: number
    ): Promise<string> {
        const pod = await this.podFor(sessionId);
        const target = this.resolvePath(filePath);
        const stats = await this.stat(pod, target);

        if (stats.type === 'd') {
            throw new FileOperationError(
                `${target} is a directory`,
                FileOperationErrorCode.INVALID_PATH
            );
        }

        if (stats.size > maxBytes) {
            throw new FileOperationError(
                `${stats.name} is ${formatBytes(stats.size)}, larger than the ${formatBytes(maxBytes)} edit limit. Download it instead.`,
                FileOperationErrorCode.INVALID_PATH
            );
        }

        const result = await this.run(pod, ['cat', target], {
            maxStdoutBytes: maxBytes,
            timeoutMs: transferTimeoutMs(stats.size),
        });

        if (result.exitCode !== 0) {
            throw new FileOperationError(
                `Failed to read ${target}: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }

        if (result.stdout.includes(0)) {
            throw new FileOperationError(
                `${stats.name} is a binary file and cannot be edited as text`,
                FileOperationErrorCode.INVALID_PATH
            );
        }

        return result.stdout.toString('utf8');
    }

    public async streamFile(
        sessionId: string,
        filePath: string,
        destination: Writable,
        onMetadata?: (file: FileMetadata) => void
    ): Promise<void> {
        const pod = await this.podFor(sessionId);
        const target = this.resolvePath(filePath);
        const stats = await this.stat(pod, target);

        if (stats.type === 'd') {
            throw new FileOperationError(
                `${target} is a directory`,
                FileOperationErrorCode.INVALID_PATH
            );
        }

        onMetadata?.(stats);

        const result = await this.withKeepalive(sessionId, () => this.run(pod, ['cat', target], {
            stdout: destination,
            timeoutMs: transferTimeoutMs(stats.size),
        }));

        if (result.exitCode !== 0) {
            throw new FileOperationError(
                `Failed to read ${target}: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }
    }

    public async streamArchive(
        sessionId: string,
        files: FileSpec[],
        destination: Writable
    ): Promise<void> {
        const pod = await this.podFor(sessionId);
        const targets = files.map(file => this.resolvePath(file.path));

        if (targets.length === 0) {
            throw new FileOperationError(
                'No files given to download',
                FileOperationErrorCode.INVALID_PATH
            );
        }

        const root = commonParent(targets);
        // "./name" keeps a leading dash in a file name from being read as a
        // tar option.
        const members = targets
            .map(target => shQuote(`./${path.posix.relative(root, target)}`))
            .join(' ');

        const result = await this.withKeepalive(sessionId, () => this.run(pod, [
            'sh', '-c',
            `tar -czf - -C ${shQuote(root)} ${members}`,
        ], { stdout: destination, timeoutMs: ARCHIVE_TIMEOUT_MS }));

        if (result.exitCode !== 0) {
            throw new FileOperationError(
                `Failed to pack the download: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }
    }

    public async writeFileStream(
        sessionId: string,
        filePath: string,
        source: Readable,
        size: number
    ): Promise<void> {
        const pod = await this.podFor(sessionId);
        const target = this.resolvePath(filePath);
        const dir = path.posix.dirname(target);

        if (size === 0) {
            source.resume();
            await this.runOrThrow(pod, [
                'sh', '-c',
                `mkdir -p ${shQuote(dir)} && : > ${shQuote(target)}`,
            ], `Failed to create ${target}`);
            await this.touchSession(sessionId);
            return;
        }

        const tempTarget = `${dir}/.${path.posix.basename(target)}.${randomSuffix()}.part`;
        const command = [
            'sh', '-c',
            `mkdir -p ${shQuote(dir)} `
            + `&& head -c ${size} > ${shQuote(tempTarget)} `
            + `&& mv ${shQuote(tempTarget)} ${shQuote(target)} `
            + `&& stat -c %s ${shQuote(target)}`,
        ];

        let result;
        try {
            result = await this.withKeepalive(sessionId, () => this.run(pod, command, {
                stdin: source,
                timeoutMs: transferTimeoutMs(size),
            }));
        } catch (error) {
            await this.removeQuietly(pod, tempTarget);
            throw error;
        }

        if (result.exitCode !== 0) {
            await this.removeQuietly(pod, tempTarget);
            throw new FileOperationError(
                `Failed to write ${target}: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }

        const written = parseInt(result.stdout.toString('utf8').trim(), 10);
        if (written !== size) {
            throw new FileOperationError(
                `${path.posix.basename(target)} was truncated in transfer (${written} of ${size} bytes)`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }
    }

    public async writeFile(
        sessionId: string,
        filePath: string,
        content: Buffer | string
    ): Promise<void> {
        const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
        await this.writeFileStream(sessionId, filePath, Readable.from(buffer), buffer.length);
    }

    public async createDirectory(sessionId: string, dirPath: string): Promise<void> {
        const pod = await this.podFor(sessionId);
        const target = this.resolvePath(dirPath);

        await this.runOrThrow(pod, ['mkdir', '-p', target], `Failed to create directory ${target}`);
        await this.touchSession(sessionId);
    }

    public async movePath(
        sessionId: string,
        sourcePath: string,
        destinationPath: string
    ): Promise<void> {
        const pod = await this.podFor(sessionId);
        const source = this.resolvePath(sourcePath);
        const destination = this.resolvePath(destinationPath);

        if (destination === source) return;
        if (destination.startsWith(`${source}/`)) {
            throw new FileOperationError(
                'A directory cannot be moved inside itself',
                FileOperationErrorCode.INVALID_PATH
            );
        }

        const result = await this.run(pod, [
            'sh', '-c',
            `test ! -e ${shQuote(destination)} || { echo exists >&2; exit 17; }; `
            + `mkdir -p ${shQuote(path.posix.dirname(destination))} `
            + `&& mv ${shQuote(source)} ${shQuote(destination)}`,
        ]);

        if (result.exitCode === 17) {
            throw new FileOperationError(
                `${path.posix.basename(destination)} already exists`,
                FileOperationErrorCode.INVALID_PATH
            );
        }
        if (result.exitCode !== 0) {
            throw new FileOperationError(
                `Failed to move ${source}: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }

        await this.touchSession(sessionId);
    }

    public async deletePaths(sessionId: string, targetPaths: string[]): Promise<void> {
        const pod = await this.podFor(sessionId);
        const targets = targetPaths.map(target => this.resolvePath(target));

        if (targets.includes(SESSION_ROOT)) {
            throw new FileOperationError(
                'The session root cannot be deleted',
                FileOperationErrorCode.INVALID_PATH
            );
        }

        const quoted = targets.map(shQuote).join(' ');
        const result = await this.withKeepalive(sessionId, () => this.run(pod, [
            'sh', '-c', `rm -rf -- ${quoted}`,
        ], { timeoutMs: ARCHIVE_TIMEOUT_MS }));

        if (result.exitCode === 0) return;

        if (!isNfsLockError(result.stderr)) {
            throw new FileOperationError(
                `Failed to delete: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }

        await this.withKeepalive(sessionId, () => this.run(pod, [
            'sh', '-c',
            `for target in ${quoted}; do `
            + `find "$target" -mindepth 1 ! -name '.nfs*' -exec rm -rf {} + 2>/dev/null; `
            + `rm -rf "$target" 2>/dev/null; done; exit 0`,
        ], { timeoutMs: ARCHIVE_TIMEOUT_MS }));

        console.warn('Some deleted paths are still in use; locked files will disappear when released');
    }

    public async createArchive(
        sessionId: string,
        files: FileSpec[],
        archiveName?: string
    ): Promise<string> {
        const pod = await this.podFor(sessionId);
        const targets = files.map(file => this.resolvePath(file.path));

        if (targets.length === 0) {
            throw new FileOperationError(
                'No files given to archive',
                FileOperationErrorCode.INVALID_PATH
            );
        }

        const root = commonParent(targets);
        const requested = archiveName ? stripArchiveSuffix(sanitizeName(archiveName)) : defaultArchiveName(targets);
        const members = targets
            .map(target => shQuote(`./${path.posix.relative(root, target)}`))
            .join(' ');

        const result = await this.withKeepalive(sessionId, () => this.run(pod, [
            'sh', '-c',
            `cd ${shQuote(root)} || exit 1; `
            + `${uniqueNameScript(requested, '.tar.gz')} `
            + `tmp=".$name.part"; `
            + `tar -czf "$tmp" ${members} && mv "$tmp" "$name" && printf %s "$name" `
            + `|| { rm -f "$tmp"; exit 1; }`,
        ], { timeoutMs: ARCHIVE_TIMEOUT_MS }));

        if (result.exitCode !== 0) {
            throw new FileOperationError(
                `Failed to create the archive: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }

        return `${root}/${result.stdout.toString('utf8').trim()}`;
    }

    public async extractArchive(sessionId: string, archivePath: string): Promise<string> {
        const pod = await this.podFor(sessionId);
        const archive = this.resolvePath(archivePath);
        const fileName = path.posix.basename(archive);
        const format = detectArchiveFormat(fileName);

        if (!format) {
            throw new FileOperationError(
                `${fileName} is not a supported archive (${SUPPORTED_ARCHIVE_EXTENSIONS.join(', ')})`,
                FileOperationErrorCode.INVALID_PATH
            );
        }

        await this.stat(pod, archive);

        if (format.listFragment) {
            const listing = await this.run(pod, ['sh', '-c', format.listFragment(archive)], {
                timeoutMs: ARCHIVE_TIMEOUT_MS,
            });

            if (listing.exitCode !== 0) {
                throw new FileOperationError(
                    `${fileName} could not be read: ${listing.stderr.trim()}`,
                    FileOperationErrorCode.POD_EXEC_FAILED
                );
            }

            const unsafe = unsafeEntries(format.parseEntries(listing.stdout.toString('utf8')));
            if (unsafe.length > 0) {
                throw new FileOperationError(
                    `${fileName} contains entries that would be written outside the destination: ${unsafe.slice(0, 3).join(', ')}`,
                    FileOperationErrorCode.INVALID_PATH
                );
            }
        }

        const parent = path.posix.dirname(archive);
        const base = sanitizeName(archiveBaseName(fileName, format.extension));

        const result = await this.withKeepalive(sessionId, () => this.run(pod, [
            'sh', '-c',
            `cd ${shQuote(parent)} || exit 1; `
            + `${uniqueNameScript(base, '')} `
            + `mkdir -p "$name" && ${format.extractFragment(archive, '"$name"')} `
            + `&& printf %s "$name" || { rm -rf "$name"; exit 1; }`,
        ], { timeoutMs: ARCHIVE_TIMEOUT_MS }));

        if (result.exitCode !== 0) {
            const detail = result.stderr.trim();
            throw new FileOperationError(
                detail.includes('not found')
                    ? `${fileName} cannot be extracted: the session container has no tool for ${format.extension} files`
                    : `Failed to extract ${fileName}: ${detail}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }

        await this.touchSession(sessionId);
        return `${parent}/${result.stdout.toString('utf8').trim()}`;
    }

    private async run(pod: PodRef, command: string[], options: ExecOptions = {}) {
        return execInPod(pod, command, options);
    }

    private async runOrThrow(pod: PodRef, command: string[], message: string): Promise<void> {
        const result = await this.run(pod, command);
        if (result.exitCode !== 0) {
            throw new FileOperationError(
                `${message}: ${result.stderr.trim()}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }
    }

    private async removeQuietly(pod: PodRef, target: string): Promise<void> {
        try {
            await this.run(pod, ['rm', '-f', target]);
        } catch (error) {
            console.error(`Could not remove temporary file ${target}:`, error);
        }
    }

    private async stat(pod: PodRef, target: string): Promise<FileMetadata> {
        const result = await this.run(pod, ['stat', '-c', STAT_FORMAT, target]);

        if (result.exitCode !== 0) {
            throw new FileOperationError(
                `${target} not found`,
                FileOperationErrorCode.FILE_NOT_FOUND
            );
        }

        const [line] = this.parseStatLines(result.stdout.toString('utf8'));
        if (!line) {
            throw new FileOperationError(
                `Could not read metadata for ${target}`,
                FileOperationErrorCode.POD_EXEC_FAILED
            );
        }

        return this.toMetadata(line);
    }

    private parseStatLines(stdout: string): StatLine[] {
        const lines: StatLine[] = [];

        for (const raw of stdout.split('\n')) {
            if (raw.trim().length === 0) continue;

            const parts = raw.split('|');
            if (parts.length < 5) continue;

            lines.push({
                size: parseInt(parts[0], 10) || 0,
                modifyTime: (parseInt(parts[1], 10) || 0) * 1000,
                description: parts[2],
                octalPermissions: parts[3],
                path: parts.slice(4).join('|'),
            });
        }

        return lines;
    }

    private toMetadata(line: StatLine): FileMetadata {
        const type = line.description.includes('directory')
            ? 'd'
            : line.description.includes('symbolic link') ? 'l' : '-';
        const name = path.posix.basename(line.path);

        return {
            name,
            type,
            size: line.size,
            modifyTime: line.modifyTime,
            path: line.path,
            permissions: type + formatPermissions(line.octalPermissions),
            isText: type === '-' && looksTextual(name, line.size),
        };
    }

    private resolvePath(input: string): string {
        if (!input || input.includes('\0')) {
            throw new FileOperationError('Invalid path', FileOperationErrorCode.INVALID_PATH);
        }

        const absolute = input.startsWith('/') ? input : path.posix.join(SESSION_ROOT, input);
        const normalized = path.posix.normalize(absolute).replace(/\/+$/, '') || '/';

        if (normalized !== SESSION_ROOT && !normalized.startsWith(`${SESSION_ROOT}/`)) {
            throw new FileOperationError(
                `${input} is outside the session directory`,
                FileOperationErrorCode.INVALID_PATH
            );
        }

        return normalized;
    }

    private async podFor(sessionId: string): Promise<PodRef> {
        const session = await this.validateSession(sessionId);
        return {
            podName: session.podName,
            namespace: session.namespace,
            container: FILE_EDITOR_CONTAINER,
        };
    }

    private async validateSession(sessionId: string): Promise<FileEditSession> {
        const sessions = FileSessionService.getInstance();
        const session = await sessions.getSession(sessionId);

        if (!session) {
            throw new FileOperationError(
                `Session ${sessionId} not found`,
                FileOperationErrorCode.SESSION_NOT_FOUND
            );
        }

        if (session.status !== 'ready') {
            throw new FileOperationError(
                `Session ${sessionId} is not ready (status: ${session.status})`,
                FileOperationErrorCode.SESSION_NOT_READY
            );
        }

        return session;
    }

    private async touchSession(sessionId: string): Promise<void> {
        try {
            await FileSessionService.getInstance().refreshActivity(sessionId);
        } catch (error) {
            console.error('Error refreshing session activity:', error);
        }
    }

    private async withKeepalive<T>(sessionId: string, work: () => Promise<T>): Promise<T> {
        const timer = setInterval(() => void this.touchSession(sessionId), KEEPALIVE_MS);
        try {
            return await work();
        } finally {
            clearInterval(timer);
            await this.touchSession(sessionId);
        }
    }
}

function uniqueNameScript(base: string, extension: string): string {
    const suffix = extension ? shQuote(extension) : '';
    return `name=${shQuote(base)}${suffix}; i=1; `
        + `while [ -e "$name" ]; do name=${shQuote(base)}-$i${suffix}; i=$((i+1)); done;`;
}

function commonParent(targets: string[]): string {
    const parents = targets.map(target => path.posix.dirname(target).split('/'));
    const [first, ...rest] = parents;

    let shared = first;
    for (const parts of rest) {
        const limit = Math.min(shared.length, parts.length);
        let index = 0;
        while (index < limit && shared[index] === parts[index]) index++;
        shared = shared.slice(0, index);
    }

    const joined = shared.join('/');
    return joined.startsWith(SESSION_ROOT) ? joined : SESSION_ROOT;
}

function defaultArchiveName(targets: string[]): string {
    if (targets.length === 1) return path.posix.basename(targets[0]);
    return `archive-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
}

function stripArchiveSuffix(name: string): string {
    return name.replace(/\.tar\.gz$|\.tgz$/i, '');
}

function sanitizeName(name: string): string {
    const cleaned = name.replace(/[/\0]/g, '_').trim();
    if (cleaned.length === 0 || cleaned === '.' || cleaned === '..') {
        throw new FileOperationError('Invalid name', FileOperationErrorCode.INVALID_PATH);
    }
    return cleaned;
}

export function validateUploadName(name: string): string {
    const segments = name.split('/').filter(segment => segment.length > 0 && segment !== '.');

    if (name.startsWith('/') || name.includes('\0') || segments.includes('..') || segments.length === 0) {
        throw new FileOperationError(
            `"${name}" is not a valid file name`,
            FileOperationErrorCode.INVALID_PATH
        );
    }

    return segments.join('/');
}

function formatPermissions(octal: string): string {
    const modes = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const bits = parseInt(octal, 8);

    if (Number.isNaN(bits)) return '---------';

    return modes[(bits >> 6) & 7] + modes[(bits >> 3) & 7] + modes[bits & 7];
}

const TEXT_EXTENSIONS = new Set([
    '.bash', '.bat', '.cfg', '.cmd', '.conf', '.config', '.csv', '.dockerignore', '.editorconfig',
    '.env', '.gitignore', '.gradle', '.h', '.hpp', '.htaccess', '.html', '.ini', '.java', '.js',
    '.json', '.json5', '.jsx', '.log', '.lua', '.md', '.mcfunction', '.mcmeta', '.php', '.pl',
    '.properties', '.ps1', '.py', '.rb', '.rs', '.sh', '.sql', '.svg', '.toml', '.ts', '.tsx',
    '.txt', '.xml', '.yaml', '.yml', '.zsh',
]);

const TEXT_FILENAMES = new Set(['dockerfile', 'makefile', 'readme', 'license', 'changelog']);

const MAX_TEXT_BYTES = 2 * 1024 * 1024;

function looksTextual(name: string, size: number): boolean {
    if (size > MAX_TEXT_BYTES) return false;
    if (size === 0) return true;

    const lower = name.toLowerCase();
    return TEXT_EXTENSIONS.has(path.posix.extname(lower)) || TEXT_FILENAMES.has(lower);
}

function isNfsLockError(stderr: string): boolean {
    return stderr.includes('.nfs') && /resource busy|device or resource busy/i.test(stderr);
}

function transferTimeoutMs(bytes: number): number {
    return Math.min(30 * 60_000, 60_000 + Math.ceil(bytes / 1024));
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 10);
}
