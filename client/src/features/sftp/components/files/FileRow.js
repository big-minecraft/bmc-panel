import React from 'react';
import { useFileOperations } from '../../hooks/useFileOperations';
import FileIcon from './FileIcon';
import FileActions from './FileActions';
import { formatFileSize, formatDate } from '../../utils/fileUtils';
import { isTextFile } from '../../utils/textUtil';

const FileRow = ({ file, isSelected, onSelect }) => {
    const { handleFileClick } = useFileOperations();

    return (
        <tr className={isSelected ? 'table-active' : ''}>
            <td>
                <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isSelected}
                    onChange={onSelect}
                />
            </td>
            <td>
                <button
                    className={`btn btn-link text-decoration-none p-0 text-start w-100 ${
                        file.type !== 'd' && !isTextFile(file.name) ? 'pe-none' : ''
                    }`}
                    onClick={() => handleFileClick(file)}
                    title={file.type === 'd' ? 'Open directory' : isTextFile(file.name) ? 'Edit file' : ''}
                >
                    <FileIcon file={file} />
                    {file.name}
                </button>
            </td>
            <td>
                <span className={`badge ${file.type === 'd' ? 'bg-warning' : 'bg-secondary'}`}>
                    {file.type === 'd' ? 'Directory' : 'File'}
                </span>
            </td>
            <td>
                {file.type === 'd' ? '-' : formatFileSize(file.size || 0)}
            </td>
            <td>
                {formatDate(file.modifyTime)}
            </td>
            <td>
                <FileActions file={file} />
            </td>
        </tr>
    );
};

export default FileRow;