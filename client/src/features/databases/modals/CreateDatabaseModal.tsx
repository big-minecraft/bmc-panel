import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const CreateDatabaseModal = ({ show, onClose, databaseName, onDatabaseNameChange, onCreate }) => {
    if (!show) return null;

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={onClose}
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative transform overflow-hidden rounded-xl bg-white shadow-xl transition-all sm:w-full sm:max-w-lg"
                        >
                            <div className="bg-white p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Create New Database</h3>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                </div>

                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    placeholder="Enter database name"
                                    value={databaseName}
                                    onChange={(e) => onDatabaseNameChange(e.target.value)}
                                />

                                <div className="mt-6 flex justify-end gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                                        onClick={onCreate}
                                    >
                                        Create
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};