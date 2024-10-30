export const isTextFile = (filename) => {
    const textExtensions = new Set([
        'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs',
        'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'pl', 'pm', 'r',

        // Web
        'html', 'htm', 'css', 'scss', 'sass', 'less', 'svg', 'vue', 'jsx',

        // Data/Config
        'json', 'yaml', 'yml', 'xml', 'csv', 'tsv', 'ini', 'conf', 'config',
        'env', 'properties', 'props', 'toml', 'lock', 'editorconfig',

        // Documentation
        'md', 'markdown', 'txt', 'text', 'rst', 'asciidoc', 'adoc',

        // Shell/Scripts
        'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',

        // Build/Project
        'gradle', 'make', 'rake', 'cmake', 'dockerfile', 'containerfile',

        // VCS
        'gitignore', 'gitattributes', 'gitmodules',

        // Logs/Debug
        'log', 'debug', 'trace'
    ]);

    // If no extension, check if file starts with a dot (hidden config files)
    if (filename.startsWith('.')) {
        const commonDotFiles = new Set([
            'env', 'gitignore', 'dockerignore', 'eslintrc', 'prettierrc',
            'babelrc', 'npmrc', 'yarnrc', 'editorconfig'
        ]);
        // Check if the filename without the dot is in our common dot files
        return commonDotFiles.has(filename.slice(1));
    }

    // Get the extension
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) return false;

    // Check if it's in our set of text extensions
    return textExtensions.has(extension);
};

// Additional helper to get appropriate language mode for syntax highlighting
export const getEditorLanguage = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();

    // Map of file extensions to Monaco editor language identifiers
    const languageMap = {
        // JavaScript family
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'mjs': 'javascript',
        'cjs': 'javascript',

        // Web
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'svg': 'xml',
        'vue': 'html',

        // Data formats
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'xml': 'xml',
        'csv': 'plaintext',
        'tsv': 'plaintext',

        // Config files
        'ini': 'ini',
        'conf': 'ini',
        'config': 'ini',
        'env': 'plaintext',
        'properties': 'properties',
        'prop': 'properties',
        'toml': 'plaintext',

        // Documentation
        'md': 'markdown',
        'markdown': 'markdown',
        'txt': 'plaintext',
        'text': 'plaintext',
        'rst': 'plaintext',

        // Shell scripts
        'sh': 'shell',
        'bash': 'shell',
        'zsh': 'shell',
        'fish': 'shell',
        'ps1': 'powershell',
        'bat': 'bat',
        'cmd': 'bat',

        // Programming languages
        'py': 'python',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'c',
        'hpp': 'cpp',
        'cs': 'csharp',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'rs': 'rust',
        'swift': 'swift',
        'kt': 'kotlin',
        'scala': 'scala',
        'pl': 'perl',
        'r': 'r',

        // Build/Project files
        'gradle': 'groovy',
        'dockerfile': 'dockerfile',
        'containerfile': 'dockerfile',
        'makefile': 'makefile',

        // Default
        '': 'plaintext'
    };

    if (filename.startsWith('.')) {
        const name = filename.slice(1).toLowerCase();
        switch (name) {
            case 'gitignore':
            case 'dockerignore':
                return 'plaintext';
            case 'eslintrc':
            case 'babelrc':
            case 'prettierrc':
                return 'json';
            default:
                return 'plaintext';
        }
    }

    return languageMap[extension] || 'plaintext';
};