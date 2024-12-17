import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeySquare } from 'lucide-react';

export const ResetPasswordModal = ({ databaseName, onClose, onConfirm }) => {
    if (!databaseName) return null;

    return (
        <AnimatePresence>
            {databaseName && (
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
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-50 rounded-lg">
                                            <KeySquare className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Reset Database Password</h3>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                </div>

                                <p className="text-sm text-gray-500">
                                    Are you sure you want to reset the password for database "{databaseName}"? All current connections will need to be updated with the new credentials.
                                </p>

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
                                        className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600"
                                        onClick={onConfirm}
                                    >
                                        Reset Password
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