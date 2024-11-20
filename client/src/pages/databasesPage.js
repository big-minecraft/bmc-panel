import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axiosInstance from "../utils/auth";

const DatabasesPage = () => {
    const [databases, setDatabases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newDatabaseName, setNewDatabaseName] = useState('');
    const [databaseToDelete, setDatabaseToDelete] = useState(null);
    const [resettingPasswords, setResettingPasswords] = useState(new Set());
    const [notifications, setNotifications] = useState([]);
    const [showCredentials, setShowCredentials] = useState({});

    useEffect(() => {
        fetchDatabases();
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

    const fetchDatabases = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/databases');
            setDatabases(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load databases');
            console.error('Error fetching databases:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newDatabaseName.trim()) return;

        try {
            const response = await axiosInstance.post('/api/databases', {
                name: newDatabaseName
            });

            setShowCreateModal(false);
            setNewDatabaseName('');
            await fetchDatabases();
            addNotification(`Successfully created database ${newDatabaseName}`, 'success');

            // Show credentials automatically for new database
            setShowCredentials(prev => ({
                ...prev,
                [response.data.name]: true
            }));
        } catch (err) {
            console.error('Error creating database:', err);
            addNotification(`Failed to create database ${newDatabaseName}`, 'danger');
        }
    };

    const handleDelete = async () => {
        if (!databaseToDelete) return;

        try {
            await axiosInstance.delete(`/api/databases/${databaseToDelete}`);
            setDatabaseToDelete(null);
            await fetchDatabases();
            addNotification(`Successfully deleted database ${databaseToDelete}`, 'success');
        } catch (err) {
            console.error('Error deleting database:', err);
            addNotification(`Failed to delete database ${databaseToDelete}`, 'danger');
        }
    };

    const handleResetPassword = async (databaseName) => {
        setResettingPasswords(prev => new Set([...prev, databaseName]));

        try {
            const response = await axiosInstance.patch(`/api/databases/${databaseName}`);
            await fetchDatabases();
            addNotification(`Successfully reset password for ${databaseName}`, 'success');

            // Show credentials automatically after reset
            setShowCredentials(prev => ({
                ...prev,
                [databaseName]: true
            }));
        } catch (err) {
            console.error('Error resetting password:', err);
            addNotification(`Failed to reset password for ${databaseName}`, 'danger');
        } finally {
            setResettingPasswords(prev => {
                const next = new Set(prev);
                next.delete(databaseName);
                return next;
            });
        }
    };

    const toggleCredentialsVisibility = (databaseName) => {
        setShowCredentials(prev => ({
            ...prev,
            [databaseName]: !prev[databaseName]
        }));
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

            <h1 className="display-4 mb-4">Database Management</h1>

            <div className="d-flex justify-content-end mb-4">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create Database
                </button>
            </div>

            <div>
                <div className="row g-4">
                    {databases.map((database) => (
                        <div key={database.name} className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h5 className="card-title mb-1">{database.name}</h5>
                                            <p className="card-text text-muted small mb-0">
                                                Size: {database.size} • Tables: {database.tables}
                                            </p>
                                        </div>

                                        <div className="d-flex align-items-center gap-3">
                                            <button
                                                className="btn btn-outline-info btn-sm"
                                                onClick={() => handleResetPassword(database.name)}
                                                disabled={resettingPasswords.has(database.name)}
                                            >
                                                {resettingPasswords.has(database.name) ? (
                                                    <span className="spinner-border spinner-border-sm" />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-key" viewBox="0 0 16 16">
                                                        <path d="M0 8a4 4 0 0 1 7.465-2H14a.5.5 0 0 1 .354.146l1.5 1.5a.5.5 0 0 1 0 .708l-1.5 1.5a.5.5 0 0 1-.708 0L13 9.207l-.646.647a.5.5 0 0 1-.708 0L11 9.207l-.646.647a.5.5 0 0 1-.708 0L9 9.207l-.646.647A.5.5 0 0 1 8 10h-.535A4 4 0 0 1 0 8zm4-3a3 3 0 1 0 2.712 4.285A.5.5 0 0 1 7.163 9h.63l.853-.854a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.793-.793-1-1h-6.63a.5.5 0 0 1-.451-.285A3 3 0 0 0 4 5z"/>
                                                        <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                                    </svg>
                                                )}
                                            </button>

                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => setDatabaseToDelete(database.name)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                                </svg>
                                            </button>

                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => toggleCredentialsVisibility(database.name)}
                                            >
                                                {showCredentials[database.name] ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                                                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486z"/>
                                                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                                                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708"/>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                                                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {showCredentials[database.name] && (
                                        <div className="mt-2 p-3 bg-light rounded">
                                            <h6 className="mb-2">Connection Details</h6>
                                            <div className="row g-2">
                                                <div className="col-md-6">
                                                    <div className="input-group">
                                                        <span className="input-group-text">Username</span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={database.credentials.username}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="input-group">
                                                        <span className="input-group-text">Password</span>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={database.credentials.password}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Database</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter database name"
                                    value={newDatabaseName}
                                    onChange={(e) => setNewDatabaseName(e.target.value)}
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
            {databaseToDelete && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={() => setDatabaseToDelete(null)}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete the database "{databaseToDelete}"?
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setDatabaseToDelete(null)}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabasesPage;