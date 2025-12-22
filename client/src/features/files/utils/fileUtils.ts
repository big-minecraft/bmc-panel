export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
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

export const getFileType = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const typeMap = {
        // Text files
        txt: 'text',
        md: 'text',
        // Code files
        js: 'code',
        jsx: 'code',
        ts: 'code',
        tsx: 'code',
        py: 'code',
        java: 'code',
        // Archive files
        zip: 'archive',
        tar: 'archive',
        gz: 'archive',
        '7z': 'archive',
        rar: 'archive',
        // Image files
        jpg: 'image',
        jpeg: 'image',
        png: 'image',
        gif: 'image',
        svg: 'image',
    };

    return typeMap[extension] || 'unknown';
};

export const isArchiveFile = (fileName) => {
    return fileName.match(/\.(zip|tar|gz|7z|rar)$/i) !== null;
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
        bash: 'shell'
    };

    return languageMap[extension] || 'plaintext';
};

export const sortFiles = (files) => {
    return [...files].sort((a, b) => {
        // Directories first
        if (a.type === 'd' && b.type !== 'd') return -1;
        if (a.type !== 'd' && b.type === 'd') return 1;

        // Then alphabetically
        return a.name.localeCompare(b.name);
    });
};