import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, RefreshCw } from 'lucide-react';
import { useFileSessions } from '../hooks/useFileSessions';
import { FileEditSession } from '../types/fileTypes';
import SessionsList from '../components/lists/SessionsList';
import { FilesProvider } from '../context/FilesContext';

const FilesPageContent: React.FC = () => {
    const { listAllSessions } = useFileSessions();
    const [sessions, setSessions] = useState<FileEditSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadSessions = async () => {
        try {
            setError(null);
            const allSessions = await listAllSessions();
            setSessions(allSessions);
        } catch (err) {
            console.error('Error loading sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load sessions');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadSessions();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            File Sessions
                        </h1>
                        <p className="text-gray-600">
                            Manage all active file editing sessions across your deployments
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </motion.button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <FolderOpen className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Ready</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {sessions.filter(s => s.status === 'ready').length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Creating</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {sessions.filter(s => s.status === 'creating').length}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Error</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {sessions.filter(s => s.status === 'error').length}
                                </p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sessions List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <SessionsList
                        sessions={sessions}
                        onSessionsChanged={loadSessions}
                    />
                </motion.div>
            </div>
        </div>
    );
};

const FilesPage: React.FC = () => (
    <FilesProvider>
        <FilesPageContent />
    </FilesProvider>
);

export default FilesPage;
