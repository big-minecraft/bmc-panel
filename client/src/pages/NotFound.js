import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MoveLeft, XCircle } from 'lucide-react';

const NotFound = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
        >
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

            <div className="h-full flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="w-full max-w-md">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-center mb-6"
                        >
                            <h1 className="text-2xl font-semibold text-gray-900">Page Not Found</h1>
                            <p className="text-sm text-gray-600 mt-1">The page you're looking for doesn't exist or has been moved</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-lg shadow-lg p-6 mb-6"
                        >
                            <div className="flex justify-center mb-6">
                                <motion.div
                                    initial={{ rotate: -90 }}
                                    animate={{ rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 100,
                                        delay: 0.3
                                    }}
                                >
                                    <XCircle className="w-16 h-16 text-indigo-500" />
                                </motion.div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => window.history.back()}
                                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium
                                             text-gray-700 bg-gray-50 border border-gray-300 rounded-lg
                                             hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2
                                             focus:ring-gray-500 transition-colors duration-200"
                                >
                                    <MoveLeft className="w-4 h-4 mr-2"/>
                                    Go Back
                                </button>

                                <Link
                                    to="/"
                                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white
                                             bg-indigo-600 rounded-lg hover:bg-indigo-500
                                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                                             transition-colors duration-200"
                                >
                                    <Home className="w-4 h-4 mr-2"/>
                                    Return Home
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.5}}
                    className="pb-4 text-center"
                >
                    <p className="text-sm text-gray-500">
                        Need help? Contact your system administrator
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default NotFound;