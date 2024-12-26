import React, {useState, useEffect} from 'react';
import Editor from '@monaco-editor/react';
import {Loader2, X, Save} from 'lucide-react';
import {useFileOperations} from '../../hooks/useFileOperations';
import {useSFTPState, useSFTPDispatch} from '../../context/SFTPContext';
import {getEditorLanguage} from '../../utils/fileUtils';

const EditorModal = ({isOpen, file, content}) => {
    const dispatch = useSFTPDispatch();
    const {loading} = useSFTPState();
    const {handleSaveFile} = useFileOperations();
    const [newContent, setNewContent] = useState('');
    const [editorLoading, setEditorLoading] = useState(true);

    useEffect(() => {
        setNewContent(content || '');
    }, [content]);

    if (!isOpen) return null;

    const closeModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'editor',
                state: {isOpen: false, file: null, content: ''}
            }
        });
    };

    const handleSave = async () => {
        await handleSaveFile(file, newContent);
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50">
            <div className="fixed inset-4 bg-white rounded-xl shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {file ? file.name : 'Text Editor'}
                        </h3>
                        {loading.saving && (
                            <span className="flex items-center text-sm text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin mr-2"/>
                                Saving...
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
                    >
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex-1 relative">
                    {editorLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-600"/>
                        </div>
                    )}
                    <Editor
                        height="100%"
                        language={getEditorLanguage(file?.name || '')}
                        value={newContent}
                        onChange={setNewContent}
                        theme="vs-light"
                        options={{
                            minimap: {enabled: false},
                            fontSize: 14,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            readOnly: loading.saving,
                            padding: {top: 16, bottom: 16}
                        }}
                        onMount={() => setEditorLoading(false)}
                    />
                </div>

                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                    <button
                        onClick={closeModal}
                        disabled={loading.saving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading.saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center disabled:opacity-50"
                    >
                        <Save size={16} className="mr-2"/>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditorModal;