import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Clock, Activity, Server } from 'lucide-react';
import { FileEditSession } from '../../types/fileTypes';
import { useFileSessions } from '../../hooks/useFileSessions';
import CredentialsDisplay from './CredentialsDisplay';

interface SessionCardProps {
    session: FileEditSession;
    onSessionEnded?: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onSessionEnded }) => {
    const navigate = useNavigate();
    const { endSession } = useFileSessions();
    const [ending, setEnding] = React.useState(false);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const getStatusConfig = (status: FileEditSession['status']) => {
        const configs = {
            creating: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Creating', dot: 'bg-yellow-500' },
            ready: { bg: 'bg-green-50', text: 'text-green-700', label: 'Ready', dot: 'bg-green-500' },
            error: { bg: 'bg-red-50', text: 'text-red-700', label: 'Error', dot: 'bg-red-500' },
            terminating: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Terminating', dot: 'bg-gray-500' }
        };
        return configs[status];
    };

    const handleEndSession = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setEnding(true);
            await endSession(session.id);
            onSessionEnded?.();
        } catch (err) {
            console.error('Failed to end session:', err);
        } finally {
            setEnding(false);
        }
    };

    const handleResumeSession = () => {
        navigate(`/files/${session.deploymentName}`, { state: { sessionId: session.id } });
    };

    const statusConfig = getStatusConfig(session.status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className="p-6">
                {/* Header with Status */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                            <h3 className="text-lg font-semibold text-gray-900">
                                {session.deploymentName}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5" />
                            {session.podName}
                        </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                    </span>
                </div>

                {/* Session Info */}
                <div className="space-y-2.5 mb-5 pb-5 border-b border-gray-100">
                    <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 text-gray-400 mr-2.5" />
                        <span className="text-gray-600 mr-2">Created:</span>
                        <span className="text-gray-900 font-medium">
                            {formatTime(session.createdAt)}
                        </span>
                    </div>
                    <div className="flex items-center text-sm">
                        <Activity className="w-4 h-4 text-gray-400 mr-2.5" />
                        <span className="text-gray-600 mr-2">Last Activity:</span>
                        <span className="text-gray-900 font-medium">
                            {formatTime(session.lastActivity)}
                        </span>
                    </div>
                </div>

                {/* SFTP Credentials - Only show when ready and credentials exist */}
                {session.status === 'ready' && session.sftpCredentials && (
                    <CredentialsDisplay credentials={session.sftpCredentials} />
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleResumeSession}
                        disabled={session.status !== 'ready'}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Play className="w-4 h-4" />
                        <span>Resume</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleEndSession}
                        disabled={ending || session.status === 'terminating'}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Square className="w-4 h-4" />
                        <span>{ending ? 'Ending...' : 'End'}</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default SessionCard;
