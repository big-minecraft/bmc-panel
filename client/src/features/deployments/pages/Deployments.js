import React, { useState, useEffect } from 'react';
import { useDeployments } from '../hooks/useDeployments';
import { useProxy } from '../hooks/useProxy';
import { useNotifications } from '../hooks/useNotifications';
import {DeploymentsProvider, useDeploymentsContext} from '../context/DeploymentsContext';
import ProxyCard from '../components/cards/ProxyCard';
import DeploymentCard from '../components/cards/DeploymentCard';
import CreateDeploymentModal from '../components/modals/CreateDeploymentModal';
import DeleteDeploymentModal from '../components/modals/DeleteDeploymentModal';
import axiosInstance from '../../../utils/auth';

const DeploymentsContent = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deploymentToDelete, setDeploymentToDelete] = useState(null);
    const { setNodes, setIsLoadingNodes } = useDeploymentsContext();

    const { deployments, isLoading, error, fetchDeployments } = useDeployments();
    const { fetchProxyConfig } = useProxy();
    const { notifications, removeNotification } = useNotifications();

    useEffect(() => {
        Promise.all([fetchDeployments(), fetchProxyConfig()]);
    }, []);

    const handleOpenCreateModal = async () => {
        setIsLoadingNodes(true);
        try {
            const response = await axiosInstance.get('/api/nodes');
            setNodes(response.data);
            setShowCreateModal(true);
        } catch (err) {
            console.error('error fetching nodes:', err);
        } finally {
            setIsLoadingNodes(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1050 }}>
                {notifications.map(({ id, message, type }) => (
                    <div key={id} className={`alert alert-${type} alert-dismissible fade show`} role="alert">
                        {message}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => removeNotification(id)}
                        />
                    </div>
                ))}
            </div>

            <div className="d-flex justify-content-end mb-4">
                <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                    Create Deployment
                </button>
            </div>

            <div className="mb-5">
                <h2 className="h3 mb-4">Proxy</h2>
                <ProxyCard />
            </div>

            <div>
                <h2 className="h3 mb-4">Deployments</h2>
                <div className="row g-4">
                    {deployments.length === 0 ? (
                        <div className="col-12">
                            <div className="card shadow-sm border">
                                <div className="card-body text-center py-5">
                                    <h5 className="card-title mb-0 text-muted">No Deployments Found</h5>
                                </div>
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

            <CreateDeploymentModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            <DeleteDeploymentModal
                deploymentName={deploymentToDelete}
                onClose={() => setDeploymentToDelete(null)}
            />
        </div>
    );
};

const Deployments = () => {
    return (
        <DeploymentsProvider>
            <DeploymentsContent />
        </DeploymentsProvider>
    );
};

export default Deployments;