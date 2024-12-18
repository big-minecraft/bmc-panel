export const isTextFile = (filename) => {
    const textExtensions = [
        'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss',
        'html', 'xml', 'csv', 'yml', 'yaml', 'sh', 'bash', 'py',
        'java', 'rb', 'php', 'sql', 'log', 'conf', 'ini'
    ];

    const extension = filename.split('.').pop()?.toLowerCase();
    return textExtensions.includes(extension);
};