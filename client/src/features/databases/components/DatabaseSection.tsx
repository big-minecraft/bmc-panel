import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { DatabaseCard } from '../components/DatabaseCard';
import type { Database } from '../types/types';
import { EmptyState } from './EmptyState';

interface DatabaseSectionProps {
    title: string;
    type: 'sql' | 'mongo';
    databases: Database[];
    showCredentials: Record<string, boolean>;
    onCreateClick: (type: 'sql' | 'mongo') => void;
    onShowCredentials: (name: string) => void;
    onDelete: (name: string, type: 'sql' | 'mongo') => void;
    onReset: (name: string, type: 'sql' | 'mongo') => void;
}

export const DatabaseSection: React.FC<DatabaseSectionProps> = ({
                                                                    title,
                                                                    type,
                                                                    databases,
                                                                    showCredentials,
                                                                    onCreateClick,
                                                                    onShowCredentials,
                                                                    onDelete,
                                                                    onReset
                                                                }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => onCreateClick(type)}
            >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Create {type.toUpperCase()} Database</span>
            </motion.button>
        </div>

        <motion.div layout className="space-y-4 mb-12">
            <AnimatePresence mode="popLayout">
                {databases.map(database => (
                    <DatabaseCard
                        key={`${type}-${database.name}`}
                        database={database}
                        databaseType={type}
                        showCredentials={showCredentials[database.name]}
                        onShowCredentials={onShowCredentials}
                        onDelete={(name) => onDelete(name, type)}
                        onReset={(name) => onReset(name, type)}
                    />
                ))}
                {databases.length === 0 && (
                    <EmptyState
                        type={type}
                        onCreateClick={() => onCreateClick(type)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    </div>
);