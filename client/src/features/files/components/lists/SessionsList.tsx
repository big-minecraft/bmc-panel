import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import { FileEditSession } from '../../types/fileTypes';
import SessionCard from '../cards/SessionCard';

interface SessionsListProps {
    sessions: FileEditSession[];
    loading?: boolean;
    onSessionsChanged?: () => void;
}

const SessionsList: React.FC<SessionsListProps> = ({
    sessions,
    loading = false,
    onSessionsChanged
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse"
                    >
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                ))}
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-12"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="p-4 bg-blue-50 rounded-full mb-4">
                        <FolderOpen className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Active Sessions
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md">
                        You don't have any active file editing sessions. Create a new session from a deployment's file manager to get started.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
                <SessionCard
                    key={session.id}
                    session={session}
                    onSessionEnded={onSessionsChanged}
                />
            ))}
        </div>
    );
};

export default SessionsList;
