import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Database as DatabaseIcon } from 'lucide-react';

interface EmptyStateProps {
    type: 'sql' | 'mongo';
    onCreateClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onCreateClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-12"
    >
        <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-50 rounded-full mb-4">
                <DatabaseIcon className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No {type.toUpperCase()} databases yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
                Get started by creating your first {type.toUpperCase()} database. You can manage multiple databases and their credentials from here.
            </p>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={onCreateClick}
            >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Create {type.toUpperCase()} Database</span>
            </motion.button>
        </div>
    </motion.div>
);