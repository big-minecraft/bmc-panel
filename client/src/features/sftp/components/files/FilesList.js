import React from 'react';
import { useSFTPState } from '../../context/SFTPContext';
import { useFileSelection } from '../../hooks/useFileSelection';
import FileRow from './FileRow';

const FilesList = () => {
    const { files, loading } = useSFTPState();
    const { selectedFiles, handleSelectFile, handleSelectAllFiles } = useFileSelection();

    const allFilesSelected = files.length > 0 &&
        files.every(file => selectedFiles.some(selected => selected.path === file.path));

    if (loading.files) {
        return (
            <div className="card shadow-sm">
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="card shadow-sm">
                <div className="text-center py-4 text-muted">
                    This directory is empty
                </div>
            </div>
        );
    }

    return (
        <div className="card shadow-sm">
            <div className="table-responsive">
                <table className="table">
                    <thead className="table-light">
                    <tr>
                        <th style={{width: '40px'}}>
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={allFilesSelected}
                                onChange={() => handleSelectAllFiles(!allFilesSelected)}
                            />
                        </th>
                        <th style={{width: '30%'}}>Name</th>
                        <th style={{width: '15%'}}>Type</th>
                        <th style={{width: '15%'}}>Size</th>
                        <th style={{width: '25%'}}>Last Modified</th>
                        <th style={{width: '15%'}}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {files.map((file) => (
                        <FileRow
                            key={file.path}
                            file={file}
                            isSelected={selectedFiles.some(
                                selected => selected.path === file.path
                            )}
                            onSelect={() => handleSelectFile(file)}
                        />
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FilesList;