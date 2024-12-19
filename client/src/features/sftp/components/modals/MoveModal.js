import React, { useState, useEffect } from 'react';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSFTPState, useSFTPDispatch } from '../../context/SFTPContext';
import { MoveVertical, Loader2, X } from 'lucide-react';

const MoveModal = ({ isOpen }) => {
    const { currentDirectory, selectedFiles, loading } = useSFTPState();
    const dispatch = useSFTPDispatch();
    const { handleMove } = useFileOperations();

    const [path, setPath] = useState('');
    const [error, setError] = useState('');
    const [targetPath, setTargetPath] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPath('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        const cleanPath = path.trim();
        if (cleanPath) {
            const fullPath = `${currentDirectory}/${cleanPath}`.replace(/\/+/g, '/');
            setTargetPath(fullPath);
        } else {
            setTargetPath(currentDirectory);
        }
    }, [path, currentDirectory]);

    if (!isOpen) return null;

    const closeModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: { modal: 'move', state: { isOpen: false } }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await handleMove(path);
            closeModal();
        } catch (err) {
            setError(err.message || 'Failed to move files');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <MoveVertical size={20} className="text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Move {selectedFiles.length} {selectedFiles.length === 1 ? 'item' : 'items'}
                            </h3>
                        </div>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Destination Path
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className={`w-full px-4 py-3 rounded-lg bg-gray-50 border transition-all duration-200 
                                    ${error
                                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                        : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                    } 
                                    text-gray-900 text-sm placeholder-gray-400 focus:outline-none`}
                                    placeholder="Enter relative path (e.g., folder/subfolder)"
                                    value={path}
                                    onChange={(e) => setPath(e.target.value)}
                                    disabled={loading.moving}
                                    autoFocus
                                />
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Enter a relative path from the current directory
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-600">
                                Files will be moved to:
                                <code className="block mt-1 text-sm font-mono bg-white p-2 rounded border border-gray-200">
                                    {targetPath}
                                </code>
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-600 mb-2">Selected items:</p>
                            <ul className="space-y-1">
                                {selectedFiles.slice(0, 5).map((file) => (
                                    <li key={file.path} className="text-sm font-mono text-gray-600">
                                        {file.name}
                                    </li>
                                ))}
                                {selectedFiles.length > 5 && (
                                    <li className="text-sm text-gray-500">
                                        ...and {selectedFiles.length - 5} more
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading.moving}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading.moving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center transition-colors"
                            >
                                {loading.moving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Moving...
                                    </>
                                ) : (
                                    'Move'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MoveModal;