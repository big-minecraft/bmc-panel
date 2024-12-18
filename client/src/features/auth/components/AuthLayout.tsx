import { motion } from 'framer-motion';
import React from 'react';

const AuthLayout = ({ title, subtitle, children }) => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full space-y-8"
            >
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <motion.div
                        className="px-6 py-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
                            {subtitle && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-2 text-sm text-gray-600"
                                >
                                    {subtitle}
                                </motion.p>
                            )}
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthLayout;