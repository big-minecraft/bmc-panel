import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/auth";

const GamemodesPage = () => {
    const navigate = useNavigate();
    const [gamemodes, setGamemodes] = useState([]);
    const [proxyConfig, setProxyConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGamemodeName, setNewGamemodeName] = useState('');
    const [gamemodeToDelete, setGamemodeToDelete] = useState(null);
    const [restartingGamemodes, setRestartingGamemodes] = useState(new Set());
    const [restartingProxy, setRestartingProxy] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        Promise.all([fetchGamemodes(), fetchProxyConfig()]);
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

    const fetchGamemodes = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/gamemodes');
            setGamemodes(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load gamemodes');
            console.error('Error fetching gamemodes:', err);
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

    const handleToggle = async (gamemodeName, currentState) => {
        try {
            await axiosInstance.patch(`/api/gamemodes/${gamemodeName}`, {
                enabled: !currentState
            });

            setGamemodes(prevGamemodes =>
                prevGamemodes.map(gamemode =>
                    gamemode.name === gamemodeName
                        ? { ...gamemode, enabled: !currentState }
                        : gamemode
                )
            );
        } catch (err) {
            console.error('Error toggling gamemode:', err);
            addNotification(`Failed to toggle ${gamemodeName}`, 'danger');
        }
    };

    const handleRestart = async (gamemodeName) => {
        setRestartingGamemodes(prev => new Set([...prev, gamemodeName]));

        try {
            await axiosInstance.post(`/api/gamemodes/${gamemodeName}`);
            addNotification(`Successfully restarted ${gamemodeName}`, 'success');
            await fetchGamemodes();
        } catch (err) {
            console.error('Error restarting gamemode:', err);
            addNotification(`Failed to restart ${gamemodeName}`, 'danger');
        } finally {
            setRestartingGamemodes(prev => {
                const next = new Set(prev);
                next.delete(gamemodeName);
                return next;
            });
        }
    };

    const handleEdit = (gamemodeName) => {
        navigate(`/gamemodes/${gamemodeName}/edit`);
    };

    const handleViewData = (dataDirectory) => {
        navigate(`/files${dataDirectory}`);
    };

    const handleCreate = async () => {
        if (!newGamemodeName.trim()) return;

        try {
            await axiosInstance.post('/api/gamemodes', {
                name: newGamemodeName
            });

            setShowCreateModal(false);
            setNewGamemodeName('');
            await fetchGamemodes();
            addNotification(`Successfully created ${newGamemodeName}`, 'success');
        } catch (err) {
            console.error('Error creating gamemode:', err);
            addNotification(`Failed to create ${newGamemodeName}`, 'danger');
        }
    };

    const handleDelete = async () => {
        if (!gamemodeToDelete) return;

        try {
            await axiosInstance.delete(`/api/gamemodes/${gamemodeToDelete}`);
            setGamemodeToDelete(null);
            await fetchGamemodes();
            addNotification(`Successfully deleted ${gamemodeToDelete}`, 'success');
        } catch (err) {
            console.error('Error deleting gamemode:', err);
            addNotification(`Failed to delete ${gamemodeToDelete}`, 'danger');
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

            <h1 className="display-4 mb-4">Gamemode Management</h1>

            <div className="d-flex justify-content-end mb-4">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create Gamemode
                </button>
            </div>

            <div className="mb-5">
                <h2 className="h3 mb-4">Proxy</h2>
                {!proxyConfig ? (
                    <div className="card bg-dark">
                        <div className="card-body text-center py-5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor"
                                 className="bi bi-hdd-network text-muted mb-3" viewBox="0 0 16 16">
                                <path d="M4.5 5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM3 4.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
                                <path
                                    d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H8.5v3a1.5 1.5 0 0 1 1.5 1.5h5.5a.5.5 0 0 1 0 1H10A1.5 1.5 0 0 1 8.5 14h-1A1.5 1.5 0 0 1 6 12.5H.5a.5.5 0 0 1 0-1H6A1.5 1.5 0 0 1 7.5 10V7H2a2 2 0 0 1-2-2V4zm1 0v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1zm6 7.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5z"/>
                            </svg>
                            <h3 className="text-muted mb-2">No Proxy Configuration Found</h3>
                            <p className="text-muted mb-4">Configure your proxy server to get started.</p>
                            <button className="btn btn-primary" onClick={handleEditProxy}>
                                Configure Proxy
                            </button>
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
                <h2 className="h3 mb-4">Gamemodes</h2>
                <div className="row g-4">
                    {gamemodes.length === 0 ? (
                        <div className="col-12">
                            <div className="card bg-dark">
                                <div className="card-body text-center py-5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-controller text-muted mb-3" viewBox="0 0 16 16">
                                        <path d="M11.5 6.027a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm-1.5 1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm2.5-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm-1.5 1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm-6.5-3h1v1h1v1h-1v1h-1v-1h-1v-1h1v-1z"/>
                                        <path d="M3.051 3.26a.5.5 0 0 1 .354-.613l1.932-.518a.5.5 0 0 1 .62.39c.655-.079 1.35-.117 2.043-.117.72 0 1.443.041 2.12.126a.5.5 0 0 1 .622-.399l1.932.518a.5.5 0 0 1 .306.729c.14.09.266.19.373.297.408.408.78 1.05 1.095 1.772.32.733.599 1.591.805 2.466.206.875.34 1.78.364 2.606.024.816-.059 1.602-.328 2.21a1.42 1.42 0 0 1-1.445.83c-.636-.067-1.115-.394-1.513-.773-.245-.232-.496-.526-.739-.808-.126-.148-.25-.292-.368-.423-.728-.804-1.597-1.527-3.224-1.527-1.627 0-2.496.723-3.224 1.527-.119.131-.242.275-.368.423-.243.282-.494.575-.739.808-.398.38-.877.706-1.513.773a1.42 1.42 0 0 1-1.445-.83c-.27-.608-.352-1.395-.329-2.21.024-.826.16-1.73.365-2.606.206-.875.486-1.733.805-2.466.315-.722.687-1.364 1.094-1.772a2.34 2.34 0 0 1 .433-.335.504.504 0 0 1-.028-.079zm2.036.412c-.877.185-1.469.443-1.733.708-.276.276-.587.783-.885 1.465a13.748 13.748 0 0 0-.748 2.295 12.351 12.351 0 0 0-.339 2.406c-.022.755.062 1.368.243 1.776a.42.42 0 0 0 .426.24c.327-.034.61-.199.929-.502.212-.202.4-.423.615-.674.133-.156.276-.323.44-.504C4.861 9.969 5.978 9.027 8 9.027s3.139.942 3.965 1.855c.164.181.307.348.44.504.214.251.403.472.615.674.318.303.601.468.929.503a.42.42 0 0 0 .426-.241c.18-.408.265-1.02.243-1.776a12.354 12.354 0 0 0-.339-2.406 13.753 13.753 0 0 0-.748-2.295c-.298-.682-.61-1.19-.885-1.465-.264-.265-.856-.523-1.733-.708-.85-.179-1.877-.27-2.913-.27-1.036 0-2.063.091-2.913.27z"/>
                                    </svg>
                                    <h3 className="text-muted mb-2">No Gamemodes Found</h3>
                                    <p className="text-muted mb-4">Get started by creating your first gamemode.</p>
                                    <button
                                        className="btn btn-primary d-inline-flex align-items-center gap-2"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                                        </svg>
                                        Create Gamemode
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        gamemodes.map((gamemode) => (
                        <div key={gamemode.name} className="col-12">
                            <div className="card">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="card-title mb-1">{gamemode.name}</h5>
                                        <p className="card-text text-muted small mb-0">
                                            {gamemode.path}
                                        </p>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <button
                                            className="btn btn-outline-info btn-sm"
                                            onClick={() => handleViewData(gamemode.dataDirectory)}
                                            title="View Data Directory"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-folder" viewBox="0 0 16 16">
                                                <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                                            </svg>
                                        </button>

                                        <button
                                            className="btn btn-outline-warning btn-sm"
                                            onClick={() => handleRestart(gamemode.name)}
                                            title="Restart Gamemode"
                                            disabled={restartingGamemodes.has(gamemode.name)}
                                        >
                                            {restartingGamemodes.has(gamemode.name) ? (
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
                                            onClick={() => handleEdit(gamemode.name)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                            </svg>
                                        </button>

                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => setGamemodeToDelete(gamemode.name)}
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
                                                id={`gamemode-toggle-${gamemode.name}`}
                                                checked={gamemode.enabled}
                                                onChange={() => handleToggle(gamemode.name, gamemode.enabled)}
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor={`gamemode-toggle-${gamemode.name}`}
                                            >
                                                {gamemode.enabled ? 'Enabled' : 'Disabled'}
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
                                <h5 className="modal-title">Create New Gamemode</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter gamemode name"
                                    value={newGamemodeName}
                                    onChange={(e) => setNewGamemodeName(e.target.value)}
                                />
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
            {gamemodeToDelete && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={() => setGamemodeToDelete(null)}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete the gamemode "{gamemodeToDelete}"?
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setGamemodeToDelete(null)}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamemodesPage;