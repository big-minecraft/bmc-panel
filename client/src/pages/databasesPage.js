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
    const [databaseToReset, setDatabaseToReset] = useState(null);
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

    const handleResetPassword = async () => {
        if (!databaseToReset) return;

        setResettingPasswords(prev => new Set([...prev, databaseToReset]));

        try {
            const response = await axiosInstance.patch(`/api/databases/${databaseToReset}`);
            await fetchDatabases();
            addNotification(`Successfully reset password for ${databaseToReset}`, 'success');
            setShowCredentials(prev => ({
                ...prev,
                [databaseToReset]: true
            }));
        } catch (err) {
            console.error('Error resetting password:', err);
            addNotification(`Failed to reset password for ${databaseToReset}`, 'danger');
        } finally {
            setResettingPasswords(prev => {
                const next = new Set(prev);
                next.delete(databaseToReset);
                return next;
            });
            setDatabaseToReset(null);
        }
    };

    const toggleCredentialsVisibility = (databaseName) => {
        setShowCredentials(prev => ({
            ...prev,
            [databaseName]: !prev[databaseName]
        }));
    };

    const formatSize = (size) => `${size} MB`;

    const EmptyState = () => (
        <div className="col-12">
            <div className="card">
                <div className="card-body text-center py-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-database text-muted mb-3" viewBox="0 0 16 16">
                        <path d="M4.318 2.687C5.234 2.271 6.536 2 8 2s2.766.27 3.682.687C12.644 3.125 13 3.627 13 4c0 .374-.356.875-1.318 1.313C10.766 5.729 9.464 6 8 6s-2.766-.27-3.682-.687C3.356 4.875 3 4.373 3 4c0-.374.356-.875 1.318-1.313ZM13 5.698V7c0 .374-.356.875-1.318 1.313C10.766 8.729 9.464 9 8 9s-2.766-.27-3.682-.687C3.356 7.875 3 7.373 3 7V5.698c.271.202.58.378.904.525C4.978 6.711 6.427 7 8 7s3.022-.289 4.096-.777A4.92 4.92 0 0 0 13 5.698ZM14 4c0-1.007-.875-1.755-1.904-2.223C11.022 1.289 9.573 1 8 1s-3.022.289-4.096.777C2.875 2.245 2 2.993 2 4v9c0 1.007.875 1.755 1.904 2.223C4.978 15.71 6.427 16 8 16s3.022-.289 4.096-.777C13.125 14.755 14 14.007 14 13V4Zm-1 4.698V10c0 .374-.356.875-1.318 1.313C10.766 11.729 9.464 12 8 12s-2.766-.27-3.682-.687C3.356 10.875 3 10.373 3 10V8.698c.271.202.58.378.904.525C4.978 9.71 6.427 10 8 10s3.022-.289 4.096-.777A4.92 4.92 0 0 0 13 8.698Zm0 3V13c0 .374-.356.875-1.318 1.313C10.766 14.729 9.464 15 8 15s-2.766-.27-3.682-.687C3.356 13.875 3 13.373 3 13v-1.302c.271.202.58.378.904.525C4.978 12.71 6.427 13 8 13s3.022-.289 4.096-.777c.324-.147.633-.323.904-.525Z"/>
                    </svg>
                    <h3 className="text-muted mb-2">No Databases Found</h3>
                    <p className="text-muted mb-4">Get started by creating your first database.</p>
                    <button
                        className="btn btn-primary d-inline-flex align-items-center gap-2"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                        </svg>
                        Create Database
                    </button>
                </div>
            </div>
        </div>
    );

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
        <div className="container py-5">
            <div className="row">
                {databases.length === 0 ? (
                    <EmptyState />
                ) : (
                    databases.map(database => (
                        <div key={database.name} className="col-md-4">
                            <div className="card mb-4 shadow-sm">
                                <div className="card-body">
                                    <h5 className="card-title">{database.name}</h5>
                                    <p className="card-text">Size: {formatSize(database.size)}</p>
                                    <p className="card-text">Users: {database.users}</p>
                                    <button
                                        className="btn btn-danger btn-sm me-2"
                                        onClick={() => setDatabaseToDelete(database.name)}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm me-2"
                                        onClick={() => setDatabaseToReset(database.name)}
                                        disabled={resettingPasswords.has(database.name)}
                                    >
                                        {resettingPasswords.has(database.name) ? (
                                            <span className="spinner-border spinner-border-sm"></span>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => toggleCredentialsVisibility(database.name)}
                                    >
                                        {showCredentials[database.name] ? 'Hide' : 'Show'} Credentials
                                    </button>
                                    {showCredentials[database.name] && (
                                        <div className="mt-2">
                                            <strong>Credentials:</strong>
                                            <p className="mb-0">
                                                <span className="fw-bold">Username:</span> {database.credentials.username}
                                            </p>
                                            <p className="mb-0">
                                                <span className="fw-bold">Password:</span> {database.credentials.password}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <button
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={() => setShowCreateModal(true)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                </svg>
                Create Database
            </button>

            {/* Notifications */}
            <div className="position-fixed bottom-0 end-0 p-3">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`alert alert-${notification.type} alert-dismissible fade show`}
                        role="alert"
                    >
                        {notification.message}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() =>
                                setNotifications(prev =>
                                    prev.filter(n => n.id !== notification.id)
                                )
                            }
                        ></button>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            <div
                className={`modal ${showCreateModal ? 'd-block' : ''}`}
                tabIndex="-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Create Database</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowCreateModal(false)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="databaseName">Database Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="databaseName"
                                    value={newDatabaseName}
                                    onChange={e => setNewDatabaseName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowCreateModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleCreate}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <div
                className={`modal ${databaseToDelete ? 'd-block' : ''}`}
                tabIndex="-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Delete Database</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setDatabaseToDelete(null)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            Are you sure you want to delete{' '}
                            <strong>{databaseToDelete}</strong>? This action cannot be undone.
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setDatabaseToDelete(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Password Confirmation Modal */}
            <div
                className={`modal ${databaseToReset ? 'd-block' : ''}`}
                tabIndex="-1"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Reset Password</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setDatabaseToReset(null)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            Are you sure you want to reset the password for{' '}
                            <strong>{databaseToReset}</strong>?
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setDatabaseToReset(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-warning"
                                onClick={handleResetPassword}
                                disabled={resettingPasswords.has(databaseToReset)}
                            >
                                {resettingPasswords.has(databaseToReset) ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabasesPage;