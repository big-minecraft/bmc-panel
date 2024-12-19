import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';

const ConfigHeader = ({ title, onBack, onSave, isSaving }) => {
    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onBack}
                            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100
                       transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </motion.button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {title}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Editing configuration file
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onSave}
                            disabled={isSaving}
                            className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600
                       rounded-lg transition-colors inline-flex items-center
                       disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent
                                rounded-full animate-spin mr-2"/>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigHeader;