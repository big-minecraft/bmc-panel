import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, X } from 'lucide-react';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSFTPState, useSFTPDispatch } from '../../context/SFTPContext';
import { getEditorLanguage } from '../../utils/fileUtils';

const EditorModal = ({ isOpen, file, initialContent = '' }) => {
    const dispatch = useSFTPDispatch();
    const { loading } = useSFTPState();
    const { handleSaveFile } = useFileOperations();

    const [content, setContent] = useState('');
    const [editorLoading, setEditorLoading] = useState(true);

    useEffect(() => {
        setContent(initialContent || '');
    }, [initialContent]);

    if (!isOpen) return null;

    const closeModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'editor',
                state: { isOpen: false, file: null, content: '' }
            }
        });
    };

    const handleSave = async () => {
        try {
            await handleSaveFile(file, content);
            closeModal();
        } catch (error) {
            console.error('Error saving file:', error);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <div
                className="absolute inset-5 bg-white rounded-lg overflow-hidden flex flex-col"
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-medium">
                        {file ? `Editing: ${file.name}` : 'Text Editor'}
                    </h3>
                    <div className="flex items-center gap-4">
                        {loading.saving && (
                            <span className="flex items-center text-sm text-gray-600">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Processing...
                            </span>
                        )}
                        <button
                            onClick={closeModal}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative">
                    {editorLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                        </div>
                    )}
                    <Editor
                        height="100%"
                        language={getEditorLanguage(file?.name || '')}
                        value={content}
                        onChange={(value) => setContent(value || '')}
                        theme="vs-light"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            readOnly: loading.saving,
                            padding: { top: 16, bottom: 16 }
                        }}
                        onMount={() => setEditorLoading(false)}
                    />
                </div>

                <div className="flex justify-end gap-3 p-4 border-t">
                    <button
                        onClick={closeModal}
                        disabled={loading.saving}
                        className="px-4 py-2 rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading.saving}
                        className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                        {loading.saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditorModal;