import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from "../../../../utils/auth";
import CreateTokenModal from './CreateTokenModal';
import LoadingSpinner from '../../../../common/zold/LoadingSpinner';
import { ExternalLink, Copy, Eye, EyeOff, Plus, Trash2, Check } from 'lucide-react';

const K8sDashboardTab = () => {
    const [token, setToken] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCopied, setShowCopied] = useState(false);

    useEffect(() => {
        fetchToken();
    }, []);

    const fetchToken = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/admin/k8sdashtoken');
            setToken(response.data.token || null);
        } catch (err) {
            setError('Failed to load K8s dashboard token');
            console.error('error fetching k8s token:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const response = await axiosInstance.put('/api/admin/k8sdashtoken');
            setToken(response.data.token || null);
            setShowCreateModal(false);
        } catch (err) {
            console.error('error creating k8s token:', err);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosInstance.delete('/api/admin/k8sdashtoken');
            setToken(null);
        } catch (err) {
            console.error('error deleting k8s token:', err);
        }
    };

    const handleDashboardAccess = async () => {
        if (token) {
            await navigator.clipboard.writeText(token);
            window.open('https://k8s.wiji.dev/#/login', '_blank');
        }
    };

    const handleCopyToken = async () => {
        if (token) {
            await navigator.clipboard.writeText(token);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="p-6 space-y-6">
            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}

            {token ? (
                <div className="space-y-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDashboardAccess}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg font-medium"
                    >
                        <ExternalLink size={20} />
                        Copy Token & Open Dashboard
                    </motion.button>

                    <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Dashboard Token</h3>
                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowToken(!showToken)}
                                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                                >
                                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDelete}
                                    className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type={showToken ? "text" : "password"}
                                value={token}
                                readOnly
                                className="w-full font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200"
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopyToken}
                                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                            >
                                {showCopied ? <Check size={18} /> : <Copy size={18} />}
                            </motion.button>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg border border-gray-200 p-6 text-center"
                >
                    <h3 className="text-lg font-medium text-gray-900 mb-4">No Dashboard Token Available</h3>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Create Token
                    </motion.button>
                </motion.div>
            )}

            <CreateTokenModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreate}
            />
        </div>
    );
};

export default K8sDashboardTab;