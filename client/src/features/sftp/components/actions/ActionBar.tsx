import React, { useState } from 'react';
import { Plus, File, FolderPlus, Upload, Loader2, X } from 'lucide-react';
import { useCreateOperations } from '../../hooks/useCreateOperations';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSFTPState } from '../../context/SFTPContext';

const CreateModal = ({ isOpen, onClose }) => {
    const [tab, setTab] = useState('file');
    const {
        newFileName,
        newDirName,
        loading,
        setNewFileName,
        setNewDirName,
        handleCreateFile,
        handleCreateDir,
        fileError,
        dirError
    } = useCreateOperations();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (tab === 'file') {
            await handleCreateFile();
            if (!fileError) onClose();
        } else {
            await handleCreateDir();
            if (!dirError) onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Create New
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex space-x-2 mb-6">
                        <button
                            onClick={() => setTab('file')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg ${
                                tab === 'file'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <File size={16} className="inline-block mr-2" />
                            File
                        </button>
                        <button
                            onClick={() => setTab('directory')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg ${
                                tab === 'directory'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <FolderPlus size={16} className="inline-block mr-2" />
                            Directory
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {tab === 'file' ? 'File Name' : 'Directory Name'}
                                </label>
                                <input
                                    type="text"
                                    className={`w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                                        (tab === 'file' ? fileError : dirError)
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                            : ''
                                    }`}
                                    value={tab === 'file' ? newFileName : newDirName}
                                    onChange={(e) => tab === 'file' ? setNewFileName(e.target.value) : setNewDirName(e.target.value)}
                                    placeholder={tab === 'file' ? 'Enter file name' : 'Enter directory name'}
                                />
                                {(tab === 'file' ? fileError : dirError) && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {tab === 'file' ? fileError : dirError}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    <>Create {tab === 'file' ? 'File' : 'Directory'}</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const FileUploadButton = () => {
    const fileInputRef = React.useRef(null);
    const { uploadState: { uploading, progress } } = useSFTPState();
    const { uploadFiles } = useFileOperations();

    const handleFileChange = (e) => {
        if (e.target.files?.length > 0) {
            uploadFiles(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                disabled={uploading}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
                {uploading ? (
                    <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Uploading ({progress}%)
                    </>
                ) : (
                    <>
                        <Upload size={16} className="mr-2" />
                        Upload
                    </>
                )}
            </button>
        </div>
    );
};

const ActionBar = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            <Plus size={16} className="mr-2" />
                            Create New
                        </button>
                        <FileUploadButton />
                    </div>
                </div>
            </div>
            <CreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

export default ActionBar;