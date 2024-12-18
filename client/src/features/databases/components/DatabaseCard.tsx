import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeySquare, Trash2, ChevronRight, Database, Copy, Check, Terminal, Link2 } from 'lucide-react';

export const DatabaseCard = forwardRef(({ database, onShowCredentials, showCredentials, onDelete, onReset }, ref) => {
    const { name, size, tables, credentials } = database;
    const [copyStatus, setCopyStatus] = useState({});
    const [activeTab, setActiveTab] = useState('credentials');

    const handleCopy = async (text, field) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyStatus({ [field]: true });
            setTimeout(() => setCopyStatus({}), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const generateConnectionString = () => {
        const { username, password, host, port } = credentials;
        return `postgresql://${username}:${password}@${host}:${port}/${name}`;
    };

    const generateConnectionCommand = () => {
        const { username, host, port } = credentials;
        return `psql -h ${host} -p ${port} -U ${username} ${name}`;
    };

    const renderField = (label, value, canCopy = true, key) => (
        <div key={key} className="relative group">
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 pr-10"
                    value={value}
                    readOnly
                />
                {canCopy && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute right-2 top-7 text-gray-400 hover:text-gray-600"
                        onClick={() => handleCopy(value, label)}
                    >
                        {copyStatus[label] ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </motion.button>
                )}
            </div>
        </div>
    );

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
        >
            <motion.div
                className={`p-6 cursor-pointer ${showCredentials ? 'border-b border-gray-100' : ''}`}
                onClick={() => onShowCredentials(name)}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Database className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">{size}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-500">{tables} tables</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReset(name);
                                }}
                            >
                                <KeySquare className="w-5 h-5" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(name);
                                }}
                            >
                                <Trash2 className="w-5 h-5" />
                            </motion.button>
                        </div>

                        <motion.div
                            animate={{ rotate: showCredentials ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-gray-400"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {showCredentials && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex gap-4 mb-6">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === 'credentials'
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                    onClick={() => setActiveTab('credentials')}
                                >
                                    Credentials
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        activeTab === 'connection'
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                    onClick={() => setActiveTab('connection')}
                                >
                                    Connection Info
                                </motion.button>
                            </div>

                            <AnimatePresence mode="wait">
                                {activeTab === 'credentials' ? (
                                    <motion.div
                                        key="credentials"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        {Object.entries(credentials).map(([key, value]) =>
                                            renderField(key, value, true, `${name}-${key}`)
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="connection"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Link2 className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">Connection String</span>
                                        </div>
                                        {renderField('Connection String', generateConnectionString(), true, `${name}-connection-string`)}

                                        <div className="flex items-center gap-2 mb-2 mt-6">
                                            <Terminal className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">CLI Command</span>
                                        </div>
                                        {renderField('Command', generateConnectionCommand(), true, `${name}-cli-command`)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});