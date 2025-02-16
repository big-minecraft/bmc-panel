import {
    FileIcon,
    FileTextIcon,
    FileCodeIcon,
    ImageIcon,
    ArchiveIcon,
    FolderIcon
} from 'lucide-react';

const FileTypeIcon = ({file}) => {
    const getFileIcon = () => {
        if (file.type === 'd') {
            return {icon: FolderIcon, className: 'text-yellow-500'};
        }

        if (file.isArchived) {
            return {icon: ArchiveIcon, className: 'text-blue-500'};
        }

        const extension = file.name.split('.').pop()?.toLowerCase();

        const iconMap = {
            js: {icon: FileCodeIcon, className: 'text-yellow-600'},
            jsx: {icon: FileCodeIcon, className: 'text-yellow-600'},
            ts: {icon: FileCodeIcon, className: 'text-blue-600'},
            tsx: {icon: FileCodeIcon, className: 'text-blue-600'},
            py: {icon: FileCodeIcon, className: 'text-green-600'},
            java: {icon: FileCodeIcon, className: 'text-red-600'},
            txt: {icon: FileTextIcon, className: 'text-gray-600'},
            md: {icon: FileTextIcon, className: 'text-gray-600'},
            png: {icon: ImageIcon, className: 'text-blue-500'},
            jpg: {icon: ImageIcon, className: 'text-blue-500'},
            jpeg: {icon: ImageIcon, className: 'text-blue-500'},
            gif: {icon: ImageIcon, className: 'text-blue-500'},
        };

        return iconMap[extension] || {icon: FileIcon, className: 'text-gray-400'};
    };

    const {icon: Icon, className} = getFileIcon();

    return (
        <Icon size={16} className={`mr-2 ${className}`}/>
    );
};

export default FileTypeIcon;