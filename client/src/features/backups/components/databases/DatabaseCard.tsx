import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, ChevronDown, Shield, Download, ExternalLink } from 'lucide-react';

export interface DatabaseInfo {
    name: string;
    size: string;
    tables: number;
    credentials: {
        username: string;
        password: string;
        host: string;
        port: number;
    };
}

interface DatabaseBackupCardProps {
    database: DatabaseInfo;
    onViewBackups?: (databaseName: string) => void;
    onRestoreBackup?: (databaseName: string, backupId: string) => void;
    onDownloadBackup?: (databaseName: string, backupId: string) => void;
}

const DatabaseBackupCard = forwardRef<HTMLDivElement, DatabaseBackupCardProps>(
    ({ database, onViewBackups, onRestoreBackup, onDownloadBackup }, ref) => {
        const [expanded, setExpanded] = useState(false);

        // Mock backup data - in a real implementation this would come from props
        const mockBackups = [
            { id: 'bak1', date: '2025-02-19 06:00 AM', size: '156 MB' },
            { id: 'bak2', date: '2025-02-18 06:00 AM', size: '154 MB' },
            { id: 'bak3', date: '2025-02-17 06:00 AM', size: '152 MB' },
        ];

        const handleExpand = () => {
            setExpanded(!expanded);
            if (expanded === false && onViewBackups) {
                onViewBackups(database.name);
            }
        };

        return (
            <motion.div
                ref={ref}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all"
            >
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Database className="w-5 h-5 text-blue-500" />
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{database.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">{database.tables} tables</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-sm text-gray-500">{database.size}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleExpand}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                                aria-label={expanded ? "Hide backups" : "Show backups"}
                            >
                                <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                                    <ChevronDown className="w-5 h-5" />
                                </motion.div>
                            </motion.button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-100"
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-700">Available Backups</h4>
                                    <span className="text-xs text-gray-500">Daily automated backups</span>
                                </div>

                                <div className="space-y-2">
                                    {mockBackups.map((backup) => (
                                        <div
                                            key={backup.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-green-50 rounded-full">
                                                    <Shield className="w-4 h-4 text-green-500" />
                                                </div>

                                                <div>
                                                    <div className="text-sm font-medium text-gray-700">
                                                        {backup.date}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {backup.size}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => onRestoreBackup && onRestoreBackup(database.name, backup.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white border border-blue-100 rounded-md hover:border-blue-200 transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Restore
                                                </motion.button>

                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => onDownloadBackup && onDownloadBackup(database.name, backup.id)}
                                                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }
);

DatabaseBackupCard.displayName = 'DatabaseBackupCard';

export default DatabaseBackupCard;