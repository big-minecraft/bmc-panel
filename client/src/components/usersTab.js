import React, { useState, useEffect } from 'react';
import axiosInstance from "../utils/auth";

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/users');
            setUsers(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load users');
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAdmin = async (userId, currentStatus) => {
        try {
            await axiosInstance.patch(`/api/users/${userId}/admin`, {
                is_admin: !currentStatus
            });
            await fetchUsers();
        } catch (err) {
            console.error('Error toggling admin status:', err);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !newPassword.trim()) return;

        try {
            await axiosInstance.patch(`/api/users/${selectedUser.id}/password`, {
                password: newPassword
            });
            setShowResetPasswordModal(false);
            setSelectedUser(null);
            setNewPassword('');
        } catch (err) {
            console.error('Error resetting password:', err);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await axiosInstance.delete(`/api/users/${selectedUser.id}`);
            setShowDeleteModal(false);
            setSelectedUser(null);
            await fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <>
            <div className="row g-4">
                {users.map((user) => (
                    <div key={user.id} className="col-12">
                        <div className="card">
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="card-title mb-1">
                                        {user.username}
                                        {Boolean(user.is_admin) && (
                                            <span className="badge bg-primary ms-2">Admin</span>
                                        )}
                                    </h5>
                                    <p className="card-text text-muted small mb-0">
                                        User ID: {user.id}
                                    </p>
                                </div>

                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setShowResetPasswordModal(true);
                                        }}
                                    >
                                        Reset Password
                                    </button>
                                    <button
                                        className={`btn btn-outline-${user.is_admin ? 'warning' : 'success'} btn-sm`}
                                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                                    >
                                        {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                    </button>
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Reset Password for {selectedUser?.username}</h5>
                                <button type="button" className="btn-close" onClick={() => {
                                    setShowResetPasswordModal(false);
                                    setSelectedUser(null);
                                    setNewPassword('');
                                }}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowResetPasswordModal(false);
                                        setSelectedUser(null);
                                        setNewPassword('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleResetPassword}
                                >
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedUser(null);
                                }}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete the user "{selectedUser?.username}"?
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedUser(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleDeleteUser}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UsersTab;