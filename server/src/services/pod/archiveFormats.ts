import { shQuote } from './podExec';

export interface ArchiveFormat {
    extension: string;
    listFragment: ((archivePath: string) => string) | null;
    parseEntries: (stdout: string) => string[];
    extractFragment: (archivePath: string, destination: string) => string;
}

const tarFormat = (extension: string, compressionFlag: string): ArchiveFormat => ({
    extension,
    listFragment: archive => `tar -t${compressionFlag}f ${shQuote(archive)}`,
    parseEntries: parseLines,
    extractFragment: (archive, destination) => `tar -x${compressionFlag}f ${shQuote(archive)} -C ${destination}`,
});

const zipFormat: ArchiveFormat = {
    extension: '.zip',
    listFragment: archive => `unzip -l ${shQuote(archive)}`,
    // busybox and info-zip both print "length date time name", with the name
    // last so that spaces in it survive.
    parseEntries: stdout => parseLines(stdout)
        .map(line => line.trim().split(/\s+/))
        .filter(columns => columns.length >= 4 && /^\d+$/.test(columns[0]))
        .map(columns => columns.slice(3).join(' ')),
    extractFragment: (archive, destination) =>
        `unzip -q -o ${shQuote(archive)} -d ${destination}`,
};

const gzipFormat: ArchiveFormat = {
    extension: '.gz',
    listFragment: null,
    parseEntries: () => [],
    extractFragment: (archive, destination) => {
        const name = basename(archive).replace(/\.gz$/i, '');
        return `gunzip -c ${shQuote(archive)} > ${destination}/${shQuote(name)}`;
    },
};

const FORMATS: ArchiveFormat[] = [
    tarFormat('.tar.gz', 'z'),
    tarFormat('.tgz', 'z'),
    tarFormat('.tar.bz2', 'j'),
    tarFormat('.tbz2', 'j'),
    tarFormat('.tbz', 'j'),
    tarFormat('.tar.xz', 'J'),
    tarFormat('.txz', 'J'),
    tarFormat('.tar', ''),
    zipFormat,
    gzipFormat,
];

export function detectArchiveFormat(fileName: string): ArchiveFormat | null {
    const lower = fileName.toLowerCase();
    return FORMATS.find(format => lower.endsWith(format.extension)) ?? null;
}

export const SUPPORTED_ARCHIVE_EXTENSIONS = FORMATS.map(format => format.extension);

export function archiveBaseName(fileName: string, extension: string): string {
    const base = fileName.slice(0, fileName.length - extension.length);
    return base.length > 0 ? base : fileName;
}

export function unsafeEntries(entries: string[]): string[] {
    return entries.filter(entry =>
        entry.startsWith('/')
        || entry.split('/').includes('..')
        || entry.includes('\0')
    );
}

function parseLines(stdout: string): string[] {
    return stdout.split('\n').map(line => line.trimEnd()).filter(line => line.length > 0);
}

function basename(filePath: string): string {
    return filePath.split('/').pop() ?? filePath;
}
