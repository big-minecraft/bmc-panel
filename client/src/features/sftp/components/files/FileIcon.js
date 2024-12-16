import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFolder,
    faFile,
    faFileCode,
    faFileAlt,
    faFileImage,
    faFileArchive
} from '@fortawesome/free-solid-svg-icons';

const FileIcon = ({ file }) => {
    const getFileIcon = () => {
        if (file.type === 'd') {
            return { icon: faFolder, className: 'text-warning' };
        }

        const extension = file.name.split('.').pop()?.toLowerCase();

        if (file.isArchived) {
            return { icon: faFileArchive, className: 'text-info' };
        }

        const iconMap = {
            // Code files
            js: { icon: faFileCode, className: 'text-primary' },
            jsx: { icon: faFileCode, className: 'text-primary' },
            ts: { icon: faFileCode, className: 'text-primary' },
            tsx: { icon: faFileCode, className: 'text-primary' },
            py: { icon: faFileCode, className: 'text-success' },
            java: { icon: faFileCode, className: 'text-danger' },
            // Text files
            txt: { icon: faFileAlt, className: 'text-secondary' },
            md: { icon: faFileAlt, className: 'text-secondary' },
            // Image files
            png: { icon: faFileImage, className: 'text-info' },
            jpg: { icon: faFileImage, className: 'text-info' },
            jpeg: { icon: faFileImage, className: 'text-info' },
            gif: { icon: faFileImage, className: 'text-info' },
        };

        return iconMap[extension] || { icon: faFile, className: 'text-secondary' };
    };

    const { icon, className } = getFileIcon();

    return (
        <FontAwesomeIcon
            icon={icon}
            className={`me-2 ${className}`}
            fixedWidth
        />
    );
};

export default FileIcon;