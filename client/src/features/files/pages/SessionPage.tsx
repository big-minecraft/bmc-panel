import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Square, Loader2, Clock, Activity } from 'lucide-react';
import { useFileSessions } from '../hooks/useFileSessions';
import { FileEditSession } from '../types/fileTypes';
import { useFilesDispatch, FilesProvider } from '../context/FilesContext';

const SessionPageContent: React.FC = () => {
    const { deploymentName } = useParams<{ deploymentName: string }>();
    const navigate = useNavigate();
    const dispatch = useFilesDispatch();
    const {
        createSession,
        listSessionsByDeployment,
        endSession,
        getSessionStatus
    } = useFileSessions();

    const [session, setSession] = useState<FileEditSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (deploymentName) {
            loadSession();
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [deploymentName]);

    const loadSession = async () => {
        try {
            setLoading(true);
            setError(null);
            const sessions = await listSessionsByDeployment(deploymentName!);
            if (sessions.length > 0) {
                setSession(sessions[0]);
            }
        } catch (err) {
            console.error('Error loading session:', err);
            setError(err instanceof Error ? err.message : 'Failed to load session');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async () => {
        try {
            setCreating(true);
            setError(null);
            const newSession = await createSession(deploymentName!);
            setSession(newSession);

            // Poll until ready
            pollIntervalRef.current = setInterval(async () => {
                try {
                    const status = await getSessionStatus(newSession.id);
                    setSession(status);

                    if (status.status === 'ready') {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                        }
                        dispatch({ type: 'SET_SESSION', payload: status });
                        navigate(`/files/${deploymentName}`, { state: { sessionId: status.id } });
                    } else if (status.status === 'error') {
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                        }
                        setError('Session pod failed to start');
                        setCreating(false);
                    }
                } catch (err) {
                    console.error('Error polling session status:', err);
                }
            }, 3000); // Poll every 3 seconds
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create session');
            setCreating(false);
        }
    };

    const handleResumeSession = () => {
        if (session) {
            dispatch({ type: 'SET_SESSION', payload: session });
            navigate(`/files/${deploymentName}`, { state: { sessionId: session.id } });
        }
    };

    const handleEndSession = async () => {
        if (!session) return;

        try {
            setLoading(true);
            await endSession(session.id);
            setSession(null);
            dispatch({ type: 'SET_SESSION', payload: null });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to end session');
        } finally {
            setLoading(false);
        }
    };

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

    const getStatusBadge = (status: FileEditSession['status']) => {
        const statusConfig = {
            creating: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Creating' },
            ready: { bg: 'bg-green-50', text: 'text-green-700', label: 'Ready' },
            error: { bg: 'bg-red-50', text: 'text-red-700', label: 'Error' },
            terminating: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Terminating' }
        };

        const config = statusConfig[status];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (loading && !creating) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    File Session - {deploymentName}
                </h1>
                <p className="text-sm text-gray-600">
                    Manage your file editing session for this deployment
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
                >
                    <p className="text-sm text-red-800">{error}</p>
                </motion.div>
            )}

            {session ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                    Active Session
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Pod: {session.podName}
                                </p>
                            </div>
                            {getStatusBadge(session.status)}
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center text-sm">
                                <Clock className="w-4 h-4 text-gray-400 mr-3" />
                                <span className="text-gray-600 mr-2">Created:</span>
                                <span className="text-gray-900 font-medium">
                                    {formatTime(session.createdAt)}
                                </span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Activity className="w-4 h-4 text-gray-400 mr-3" />
                                <span className="text-gray-600 mr-2">Last Activity:</span>
                                <span className="text-gray-900 font-medium">
                                    {formatTime(session.lastActivity)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleResumeSession}
                                disabled={session.status !== 'ready' || creating}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="font-medium">Starting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        <span className="font-medium">Resume Session</span>
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleEndSession}
                                disabled={creating}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Square className="w-4 h-4" />
                                <span className="font-medium">End Session</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-12"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-blue-50 rounded-full mb-4">
                            <Play className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Active Session
                        </h3>
                        <p className="text-sm text-gray-500 max-w-sm mb-6">
                            Create a new file editing session to browse and modify files in this deployment's persistent volume.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCreateSession}
                            disabled={creating}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="font-medium">Creating Session...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    <span className="font-medium">Create New Session</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

const SessionPage: React.FC = () => (
    <FilesProvider>
        <SessionPageContent />
    </FilesProvider>
);

export default SessionPage;
