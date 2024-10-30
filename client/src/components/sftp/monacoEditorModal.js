import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, X } from 'lucide-react';
import { getEditorLanguage } from '../../utils/textUtil';

const MonacoEditorModal = ({
   isOpen,
   onClose,
   onSave,
   initialContent = '',
   fileName = '',
   loading = false
}) => {
    const [content, setContent] = useState('');
    const [editorLoading, setEditorLoading] = useState(true);

    useEffect(() => {
        setContent(initialContent || '');
    }, [initialContent]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (onSave) {
            onSave(content);
        }
    };

    const getLanguage = (filename) => {
        const parts = filename.split('.');
        const extension = parts.length > 1 ? parts.pop().toLowerCase() : '';

        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'md': 'markdown',
            'sql': 'sql',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sh': 'shell',
            'bash': 'shell',
            'txt': 'plaintext'
        };

        return languageMap[extension] || 'plaintext';
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '5%',
                    left: '5%',
                    right: '5%',
                    bottom: '5%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 500
                    }}>
                        {fileName ? `Editing: ${fileName}` : 'Text Editor'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {loading && (
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                color: '#666'
                            }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '4px',
                                cursor: 'pointer',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            aria-label="Close"
                        >
                            <X style={{ width: '20px', height: '20px' }} />
                        </button>
                    </div>
                </div>

                <div style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {editorLoading && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        }}>
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#666' }} />
                        </div>
                    )}
                    <Editor
                        height="100%"
                        efaultLanguage={getEditorLanguage(fileName)}
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
                            readOnly: loading,
                            padding: { top: 16, bottom: 16 }
                        }}
                        onMount={() => setEditorLoading(false)}
                        className="monaco-editor-container"
                    />
                </div>

                <div style={{
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            background: 'transparent',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#2563eb',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonacoEditorModal;