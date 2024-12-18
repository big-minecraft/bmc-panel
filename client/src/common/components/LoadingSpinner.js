import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
        <svg className="w-12 h-12" viewBox="0 0 45 45">
            <motion.circle
                cx="22.5"
                cy="22.5"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-blue-100"
            />
            <motion.circle
                cx="22.5"
                cy="22.5"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-blue-600"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        </svg>
        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-sm text-gray-500"
        >
            Loading...
        </motion.p>
    </div>
);

export const LoadingSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                <div className="flex items-center space-x-3">
                    <motion.div
                        className="h-10 w-10 rounded-full bg-gray-200"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <div className="space-y-2 flex-1">
                        <motion.div
                            className="h-4 w-1/4 bg-gray-200 rounded"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                            className="h-3 w-1/3 bg-gray-200 rounded"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const ErrorAlert = ({ message }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-red-50 p-4 mt-4"
    >
        <div className="flex">
            <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                </svg>
            </div>
            <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{message}</p>
            </div>
        </div>
    </motion.div>
);

export default LoadingSpinner;