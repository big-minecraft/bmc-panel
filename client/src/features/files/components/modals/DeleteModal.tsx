import {Trash2, Loader2, FolderIcon, FileIcon} from 'lucide-react';
import {useFileOperations} from '../../hooks/useFileOperations';
import {useFilesState, useFilesDispatch} from '../../context/FilesContext';

const DeleteModal = ({isOpen, files}) => {
    const {loading} = useFilesState();
    const dispatch = useFilesDispatch();
    const {handleDelete} = useFileOperations();

    if (!isOpen) return null;

    const hasDirectories = files.some(file => file.type === 'd');
    const itemCount = files.length;

    const closeModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'delete',
                state: {isOpen: false, files: []}
            }
        });
    };

    const onConfirm = async () => {
        await handleDelete(files);
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-md mx-4">
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <Trash2 size={20} className="text-red-500 mr-2"/>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Delete {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-600">Are you sure you want to delete the
                            following {itemCount === 1 ? 'item' : 'items'}?</p>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <ul className="space-y-2">
                                {files.slice(0, 5).map((file) => (
                                    <li key={file.path} className="flex items-center text-sm text-gray-600">
                                        {file.type === 'd' ? (
                                            <FolderIcon size={16} className="text-yellow-500 mr-2"/>
                                        ) : (
                                            <FileIcon size={16} className="text-gray-400 mr-2"/>
                                        )}
                                        <span className="font-mono truncate">{file.name}</span>
                                    </li>
                                ))}
                                {itemCount > 5 && (
                                    <li className="text-sm text-gray-500 pl-6">
                                        ...and {itemCount - 5} more items
                                    </li>
                                )}
                            </ul>
                        </div>

                        {hasDirectories && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start">
                                <div className="shrink-0 mr-2 mt-0.5">⚠️</div>
                                <p className="text-sm">
                                    Warning: One or more directories will be deleted along with all their contents.
                                    This action cannot be undone.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-100 p-4 flex justify-end space-x-3">
                    <button
                        onClick={closeModal}
                        disabled={loading.deleting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading.deleting}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center disabled:opacity-50"
                    >
                        {loading.deleting ? (
                            <>
                                <Loader2 size={16} className="animate-spin mr-2"/>
                                Deleting...
                            </>
                        ) : (
                            <>Delete {itemCount > 0 && itemCount} {itemCount === 1 ? 'item' : 'items'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;