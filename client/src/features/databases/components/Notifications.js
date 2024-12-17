import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-400',
    danger: 'bg-red-50 text-red-800 border-red-400',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-400',
    info: 'bg-blue-50 text-blue-800 border-blue-400'
};

export const Notifications = ({ notifications, onDismiss }) => {
    if (!notifications.length) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {notifications.map(({ id, message, type }) => (
                    <motion.div
                        key={id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`${typeStyles[type]} px-4 py-3 rounded-lg border shadow-sm flex items-center justify-between max-w-sm`}
                        role="alert"
                    >
                        <span className="text-sm font-medium">{message}</span>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => onDismiss(id)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};