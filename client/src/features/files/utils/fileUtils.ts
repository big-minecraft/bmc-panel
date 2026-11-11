export const formatFileSize = (bytes) => {
    if (!bytes || bytes < 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const EXTRACTABLE_EXTENSIONS = [
    '.tar.gz', '.tgz', '.tar.bz2', '.tbz2', '.tbz', '.tar.xz', '.txz', '.tar', '.zip', '.gz'
];

export const isExtractable = (fileName) =>
    EXTRACTABLE_EXTENSIONS.some(extension => fileName.toLowerCase().endsWith(extension));

export const apiError = (error, fallback) => error?.response?.data?.error || error?.message || fallback;

export const toUploadItems = (input) => {
    if (!input) return [];

    return Array.from(input).map((entry: any) => (
        entry instanceof File ? { file: entry, name: entry.webkitRelativePath || entry.name } : entry
    ));
};

export const getEditorLanguage = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const languageMap = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        json: 'json',
        html: 'html',
        css: 'css',
        md: 'markdown',
        sql: 'sql',
        yml: 'yaml',
        yaml: 'yaml',
        xml: 'xml',
        sh: 'shell',
        bash: 'shell',
        properties: 'ini',
        toml: 'ini'
    };

    return languageMap[extension] || 'plaintext';
};

export const sortFiles = (files) => {
    return [...files].sort((a, b) => {
        // Directories first, then by name
        if (a.type === 'd' && b.type !== 'd') return -1;
        if (a.type !== 'd' && b.type === 'd') return 1;
        return a.name.localeCompare(b.name);
    });
};