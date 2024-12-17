import React from 'react';
import Editor from '@monaco-editor/react';

const ConfigEditor = ({ content, onChange }) => {
    return (
        <div className="card-body p-0 editor-container">
            <Editor
                height="100%"
                defaultLanguage="yaml"
                theme="vs-light"
                value={content}
                onChange={onChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    tabSize: 2,
                    readOnly: false
                }}
            />
            <style>
                {`
          .editor-container {
            border-radius: 10px;
            overflow: hidden;
            height: 80%;
            border: 1px solid gray;
          }
        `}
            </style>
        </div>
    );
};

export default ConfigEditor;