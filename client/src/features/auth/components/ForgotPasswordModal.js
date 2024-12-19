import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';

export const ForgotPasswordModal = ({ show, onClose }) => (
    <AnimatePresence>
        {show && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black bg-opacity-25 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-md mx-4"
                >
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900">Password Reset</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center"
                                >
                                    <Lock className="w-8 h-8 text-indigo-600" />
                                </motion.div>
                                <p className="text-gray-600">
                                    Please contact your system administrator to reset your password.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700
                         text-white rounded-lg font-medium transition-colors duration-200"
                            >
                                Got it
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);