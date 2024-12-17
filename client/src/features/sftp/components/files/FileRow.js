import React from 'react';
import { useFileOperations } from '../../hooks/useFileOperations';
import FileIcon from './FileIcon';
import FileActions from './FileActions';
import { formatFileSize, formatDate } from '../../utils/fileUtils';
import { isTextFile } from '../../utils/textUtil';

const FileRow = ({ file, isSelected, onSelect }) => {
    const { handleFileClick } = useFileOperations();

    const isClickable = file.type === 'd' || isTextFile(file.name);

    const handleRowClick = (e) => {
        if (
            e.target.type === 'checkbox' ||
            e.target.closest('.file-actions') !== null
        ) {
            return;
        }

        if (isClickable) {
            handleFileClick(file);
        }
    };

    return (
        <tr
            onClick={handleRowClick}
            className={`${
                isSelected ? 'bg-blue-50' : ''
            } group hover:bg-gray-50 transition-colors`}
        >
            <td className="py-3 px-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer transition-colors"
                />
            </td>
            <td className="py-3 px-4">
                <div
                    className={`flex items-center text-sm ${
                        isClickable
                            ? 'cursor-pointer text-gray-900 group-hover:text-blue-600'
                            : 'cursor-default text-gray-500'
                    } transition-colors`}
                >
                    <FileIcon file={file} />
                    <span className="truncate">
                        {file.name}
                    </span>
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600 text-right group-hover:text-blue-600 transition-colors">
                {file.type === 'd' ? '-' : formatFileSize(file.size || 0)}
            </td>
            <td className="py-3 px-4 text-sm text-gray-600 text-right group-hover:text-blue-600 transition-colors">
                {formatDate(file.modifyTime)}
            </td>
            <td className="py-3 px-4 text-right">
                <div className="flex justify-end file-actions">
                    <FileActions file={file} />
                </div>
            </td>
        </tr>
    );
};

export default FileRow;