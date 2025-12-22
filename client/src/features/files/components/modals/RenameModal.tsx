import {useState, useEffect} from 'react';
import {useFilesState, useFilesDispatch} from '../../context/FilesContext';
import {useFileOperations} from '../../hooks/useFileOperations';
import {Pencil, Loader2, X} from 'lucide-react';

const RenameModal = ({isOpen, file}) => {
    const {loading} = useFilesState();
    const dispatch = useFilesDispatch();
    const {handleRename} = useFileOperations();

    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && file) {
            setNewName(file.name);
            setError('');
        }
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const closeModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {modal: 'rename', state: {isOpen: false, file: null}}
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!newName.trim()) {
            setError('Name cannot be empty');
            return;
        }

        if (newName === file.name) {
            setError('New name must be different');
            return;
        }

        const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
        if (invalidChars.test(newName)) {
            setError('Name contains invalid characters');
            return;
        }

        try {
            await handleRename(file, newName);
            closeModal();
        } catch (err) {
            setError(err.message || 'Failed to rename');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <Pencil size={20} className="text-blue-600 mr-2"/>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Rename {file.type === 'd' ? 'Directory' : 'File'}
                            </h3>
                        </div>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X size={20}/>
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
                                New Name
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
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    disabled={loading.renaming}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-600">
                                Current path:
                                <code
                                    className="block mt-1 text-sm font-mono bg-white p-2 rounded border border-gray-200">
                                    {file.path}
                                </code>
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading.renaming}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading.renaming}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center transition-colors"
                            >
                                {loading.renaming ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2"/>
                                        Renaming...
                                    </>
                                ) : (
                                    'Rename'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RenameModal;