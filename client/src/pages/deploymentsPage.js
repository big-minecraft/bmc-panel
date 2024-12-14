import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/auth";

const DeploymentsPage = () => {
    const navigate = useNavigate();
    const [deployments, setDeployments] = useState([]);
    const [proxyConfig, setProxyConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDeploymentName, setNewDeploymentName] = useState('');
    const [newDeploymentType, setNewDeploymentType] = useState('');
    const [deploymentToDelete, setDeploymentToDelete] = useState(null);
    const [restartingDeployments, setRestartingDeployments] = useState(new Set());
    const [restartingProxy, setRestartingProxy] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState('');
    const [isLoadingNodes, setIsLoadingNodes] = useState(false);
    const [createError, setCreateError] = useState(null);

    useEffect(() => {
        Promise.all([fetchDeployments(), fetchProxyConfig()]);
    }, []);

    useEffect(() => {
        if (notifications.length > 0) {
            const timer = setTimeout(() => {
                setNotifications(prev => prev.slice(1));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notifications]);

    const addNotification = (message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
    };

    const fetchProxyConfig = async () => {
        try {
            const response = await axiosInstance.get('/api/proxy-config');
            setProxyConfig(response.data);
        } catch (err) {
            console.error('Error fetching proxy config:', err);
            addNotification('Failed to load proxy configuration', 'danger');
        }
    };

    const fetchDeployments = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/deployments');
            setDeployments(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load deployments');
            console.error('Error fetching deployments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleProxy = async (currentState) => {
        try {
            await axiosInstance.patch('/api/proxy', {
                enabled: !currentState
            });
            setProxyConfig(prev => ({ ...prev, enabled: !currentState }));
            addNotification('Successfully updated proxy status', 'success');
        } catch (err) {
            console.error('Error toggling proxy:', err);
            addNotification('Failed to toggle proxy', 'danger');
        }
    };

    const handleRestartProxy = async () => {
        setRestartingProxy(true);
        try {
            await axiosInstance.post('/api/proxy');
            addNotification('Successfully restarted proxy', 'success');
            await fetchProxyConfig();
        } catch (err) {
            console.error('Error restarting proxy:', err);
            addNotification('Failed to restart proxy', 'danger');
        } finally {
            setRestartingProxy(false);
        }
    };

    const handleEditProxy = () => {
        navigate('/proxy/edit');
    };

    const handleToggle = async (deploymentName, currentState) => {
        try {
            await axiosInstance.patch(`/api/deployments/${deploymentName}`, {
                enabled: !currentState
            });

            setDeployments(prevDeployment =>
                prevDeployment.map(deployment =>
                    deployment.name === deploymentName
                        ? { ...deployment, enabled: !currentState }
                        : deployment
                )
            );
        } catch (err) {
            console.error('Error toggling deployments:', err);
            addNotification(`Failed to toggle ${deploymentName}`, 'danger');
        }
    };

    const handleRestart = async (deploymentName) => {
        setRestartingDeployments(prev => new Set([...prev, deploymentName]));

        try {
            await axiosInstance.post(`/api/deployments/${deploymentName}`);
            addNotification(`Successfully restarted ${deploymentName}`, 'success');
            await fetchDeployments();
        } catch (err) {
            console.error('Error restarting deployment:', err);
            addNotification(`Failed to restart ${deploymentName}`, 'danger');
        } finally {
            setRestartingDeployments(prev => {
                const next = new Set(prev);
                next.delete(deploymentName);
                return next;
            });
        }
    };

    const handleEdit = (deploymentName) => {
        navigate(`/deployments/${deploymentName}/edit`);
    };

    const handleViewData = (dataDirectory) => {
        navigate(`/files${dataDirectory}`);
    };

    const handleCreate = async () => {
        if (!newDeploymentName.trim()) {
            setCreateError('Deployment name is required');
            return;
        }

        if (newDeploymentType === 'persistent' && !selectedNode) {
            setCreateError('Please select a node for the persistent deployment');
            return;
        }

        try {
            await axiosInstance.post('/api/deployments', {
                name: newDeploymentName,
                type: newDeploymentType,
                node: (newDeploymentType === 'persistent' ? selectedNode : undefined)
            });

            setShowCreateModal(false);
            setNewDeploymentName('');
            setNewDeploymentType('');
            setSelectedNode('');
            setCreateError(null);
            await fetchDeployments();
            addNotification(`Successfully created ${newDeploymentName}`, 'success');
        } catch (err) {
            console.error('Error creating deployment:', err);
            setCreateError('Failed to create deployment');
        }
    };

    const handleDelete = async () => {
        if (!deploymentToDelete) return;

        try {
            await axiosInstance.delete(`/api/deployments/${deploymentToDelete}`);
            setDeploymentToDelete(null);
            await fetchDeployments();
            addNotification(`Successfully deleted ${deploymentToDelete}`, 'success');
        } catch (err) {
            console.error('Error deleting deployment:', err);
            addNotification(`Failed to delete ${deploymentToDelete}`, 'danger');
        }
    };

    const handleOpenCreateModal = async () => {
        setIsLoadingNodes(true);
        try {
            const response = await axiosInstance.get('/api/nodes');
            setNodes(response.data);
            setShowCreateModal(true);
        } catch (err) {
            console.error('Error fetching nodes:', err);
            addNotification('Failed to load nodes', 'danger');
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
                        <button type="button" className="btn-close" onClick={() => setNotifications(prev => prev.filter(n => n.id !== id))} />
                    </div>
                ))}
            </div>

            <div className="d-flex justify-content-end mb-4">
                <button
                    className="btn btn-primary"
                    onClick={handleOpenCreateModal}
                >
                    Create Deployment
                </button>
            </div>

            <div className="mb-5">
                <h2 className="h3 mb-4">Proxy</h2>
                {!proxyConfig ? (
                    <div className="col-12">
                        <div className="card shadow-sm border">
                            <div className="card-body text-center py-5">
                                <h5 className="card-title mb-0 text-muted">No Proxy Found</h5>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="card-title mb-1">Velocity Proxy</h5>
                                <p className="card-text text-muted small mb-0">{proxyConfig.path}</p>
                            </div>

                            <div className="d-flex align-items-center gap-3">
                                <button
                                    className="btn btn-outline-info btn-sm"
                                    onClick={() => handleViewData(proxyConfig.dataDirectory)}
                                    title="View Data Directory"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                         className="bi bi-folder" viewBox="0 0 16 16">
                                        <path
                                            d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                                    </svg>
                                </button>
                                <button
                                    className="btn btn-outline-warning btn-sm"
                                    onClick={handleRestartProxy}
                                    title="Restart Proxy"
                                    disabled={restartingProxy}
                                >
                                    {restartingProxy ? (
                                        <span className="spinner-border spinner-border-sm" role="status"
                                              aria-hidden="true"/>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                             fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                            <path fillRule="evenodd"
                                                  d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                            <path
                                                d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                                        </svg>
                                    )}
                                </button>

                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={handleEditProxy}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                         className="bi bi-pencil" viewBox="0 0 16 16">
                                        <path
                                            d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                    </svg>
                                </button>

                                <div className="form-check form-switch" style={{minWidth: '120px'}}>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="proxy-toggle"
                                        checked={proxyConfig.enabled}
                                        onChange={() => handleToggleProxy(proxyConfig.enabled)}
                                    />
                                    <label className="form-check-label" htmlFor="proxy-toggle">
                                        {proxyConfig.enabled ? 'Enabled' : 'Disabled'}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                        <div key={deployment.name} className="col-12">
                            <div className="card">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="card-title mb-1">{deployment.name}</h5>
                                        <p className="card-text text-muted small mb-0">
                                            {deployment.path}
                                        </p>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <button
                                            className="btn btn-outline-info btn-sm"
                                            onClick={() => handleViewData(deployment.dataDirectory)}
                                            title="View Data Directory"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-folder" viewBox="0 0 16 16">
                                                <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                                            </svg>
                                        </button>

                                        <button
                                            className="btn btn-outline-warning btn-sm"
                                            onClick={() => handleRestart(deployment.name)}
                                            title="Restart Deployment"
                                            disabled={restartingDeployments.has(deployment.name)}
                                        >
                                            {restartingDeployments.has(deployment.name) ? (
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                                    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                                                </svg>
                                            )}
                                        </button>

                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => handleEdit(deployment.name)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                            </svg>
                                        </button>

                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => setDeploymentToDelete(deployment.name)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                            </svg>
                                        </button>

                                        <div className="form-check form-switch" style={{ minWidth: '120px' }}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`deployment-toggle-${deployment.name}`}
                                                checked={deployment.enabled}
                                                onChange={() => handleToggle(deployment.name, deployment.enabled)}
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor={`deployment-toggle-${deployment.name}`}
                                            >
                                                {deployment.enabled ? 'Enabled' : 'Disabled'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Deployment</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">

                                {createError && (
                                    <div className="alert alert-danger mb-3" role="alert">
                                        {createError}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label htmlFor="deploymentName" className="form-label">Deployment Name</label>
                                    <input
                                        id="deploymentName"
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter deployment name"
                                        value={newDeploymentName}
                                        onChange={(e) => setNewDeploymentName(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label d-block">Deployment Type</label>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="deploymentType"
                                            id="persistentType"
                                            value="persistent"
                                            checked={newDeploymentType === 'persistent'}
                                            onChange={() => setNewDeploymentType('persistent')}
                                        />
                                        <label className="form-check-label" htmlFor="persistentType">
                                            Persistent
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="deploymentType"
                                            id="nonPersistentType"
                                            value="non-persistent"
                                            checked={newDeploymentType === 'non-persistent'}
                                            onChange={() => setNewDeploymentType('non-persistent')}
                                        />
                                        <label className="form-check-label" htmlFor="nonPersistentType">
                                            Non-Persistent
                                        </label>
                                    </div>
                                </div>

                                {newDeploymentType === 'persistent' && (
                                    <div className="mb-3">
                                        <label htmlFor="nodeSelection" className="form-label">Select Node</label>
                                        <select
                                            id="nodeSelection"
                                            className="form-select"
                                            value={selectedNode}
                                            onChange={(e) => setSelectedNode(e.target.value)}
                                            disabled={isLoadingNodes}
                                        >
                                            <option value="">Choose a node</option>
                                            {nodes.map((nodeName) => (
                                                <option key={nodeName} value={nodeName}>
                                                    {nodeName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleCreate}>Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deploymentToDelete && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={() => setDeploymentToDelete(null)}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete the deployment "{deploymentToDelete}"?
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDeploymentToDelete(null)}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeploymentsPage;