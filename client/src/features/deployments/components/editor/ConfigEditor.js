import React from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';

const ConfigEditor = ({ content, onChange }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
        >
            <div className="border-b border-gray-100 px-4 py-2 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-600 font-medium">Configuration</span>
            </div>
            <Editor
                height="calc(100% - 36px)"
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
                    readOnly: false,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
                    folding: true,
                    foldingHighlight: true,
                    renderLineHighlight: 'all',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: true,
                    roundedSelection: true,
                    links: true
                }}
            />
        </motion.div>
    );
};

export default ConfigEditor;