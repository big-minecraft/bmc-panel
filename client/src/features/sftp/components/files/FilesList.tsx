import React from 'react';
import { useSFTPState } from '../../context/SFTPContext';
import { useFileSelection } from '../../hooks/useFileSelection';
import FileRow from './FileRow';
import { Loader2 } from 'lucide-react';

const FilesList = () => {
    const { files, loading } = useSFTPState();
    const { selectedFiles, handleSelectFile, handleSelectAllFiles } = useFileSelection();

    const allFilesSelected = files.length > 0 &&
        files.every(file => selectedFiles.some(selected => selected.path === file.path));

    if (loading.files) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="text-center text-gray-500">
                    This directory is empty
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="overflow-visible">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="w-12 py-3 px-4">
                            <div className="flex h-[38px] items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary hover:border-blue-600 hover:bg-blue-50 h-4 w-4 cursor-pointer transition-colors"
                                    checked={allFilesSelected}
                                    onChange={() => handleSelectAllFiles(!allFilesSelected)}
                                />
                            </div>
                        </th>
                        <th className="w-[50%] py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                        </th>
                        <th className="w-[15%] py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                        </th>
                        <th className="w-[25%] py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Modified
                        </th>
                        <th className="w-[10%] py-3 px-4"></th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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