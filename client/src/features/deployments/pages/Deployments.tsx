import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {Plus} from 'lucide-react';
import {useDeployments} from '../hooks/useDeployments';
import {useProxy} from '../hooks/useProxy';
import {useNotifications} from '../hooks/useNotifications';
import {DeploymentsProvider, useDeploymentsContext} from '../context/DeploymentsContext';
import ProxyCard from '../components/cards/ProxyCard';
import DeploymentCard from '../components/cards/DeploymentCard';
import CreateDeploymentModal from '../components/modals/CreateDeploymentModal';
import DeleteDeploymentModal from '../components/modals/DeleteDeploymentModal';
import axiosInstance from '../../../utils/auth';

const DeploymentsContent = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deploymentToDelete, setDeploymentToDelete] = useState(null);
    const {setNodes, setIsLoadingNodes} = useDeploymentsContext();

    const {deployments, isLoading, error, fetchDeployments} = useDeployments();
    const {fetchProxyConfig} = useProxy();
    const {notifications, removeNotification} = useNotifications();

    useEffect(() => {
        Promise.all([fetchDeployments(), fetchProxyConfig()]);
    }, []);

    const handleOpenCreateModal = async () => {
        setIsLoadingNodes(true);
        try {
            const response = await axiosInstance.get('/api/network/nodes');
            setNodes(response.data.data.nodes);
            setShowCreateModal(true);
        } catch (err) {
            console.error('error fetching nodes:', err);
        } finally {
            setIsLoadingNodes(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {notifications.map(({id, message, type}) => (
                        <div
                            key={id}
                            className={`${
                                type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            } px-4 py-3 rounded-lg shadow-sm flex justify-between items-center`}
                        >
                            <span>{message}</span>
                            <button
                                onClick={() => removeNotification(id)}
                                className={`ml-3 ${
                                    type === 'success' ? 'text-green-400 hover:text-green-500' : 'text-red-400 hover:text-red-500'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd"
                                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                          clipRule="evenodd"/>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mb-6">
                    <motion.button
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                                 transition-colors inline-flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5"/>
                        <span>Create Deployment</span>
                    </motion.button>
                </div>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Proxy</h2>
                        <ProxyCard/>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Games</h2>
                        <div className="space-y-4">
                            {deployments.length === 0 ? (
                                <div className="bg-white rounded-xl border border-gray-200 p-8">
                                    <div className="text-center text-gray-500">
                                        <h5 className="text-lg font-medium">No Deployments Found</h5>
                                    </div>
                                </div>
                            ) : (
                                deployments.map((deployment) => (
                                    <DeploymentCard
                                        key={deployment.name}
                                        deployment={deployment}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <CreateDeploymentModal
                    show={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />

                <DeleteDeploymentModal
                    deploymentName={deploymentToDelete}
                    onClose={() => setDeploymentToDelete(null)}
                />
            </div>
        </div>
    );
};

const Deployments = () => {
    return (
        <DeploymentsProvider>
            <DeploymentsContent/>
        </DeploymentsProvider>
    );
};

export default Deployments;