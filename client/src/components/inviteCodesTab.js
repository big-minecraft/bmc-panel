import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axiosInstance from "../utils/auth";

const InviteCodesTab = () => {
    const [inviteCodes, setInviteCodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newInviteMessage, setNewInviteMessage] = useState('');
    const [codeToRevoke, setCodeToRevoke] = useState(null);

    useEffect(() => {
        fetchInviteCodes();
    }, []);

    const fetchInviteCodes = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/invite-codes');
            console.log(response.data)
            setInviteCodes(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load invite codes');
            console.error('Error fetching invite codes:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newInviteMessage.trim()) return;

        try {
            await axiosInstance.post('/api/invite-codes', {
                message: newInviteMessage
            });

            setShowCreateModal(false);
            setNewInviteMessage('');
            await fetchInviteCodes();
        } catch (err) {
            console.error('Error creating invite code:', err);
        }
    };

    const handleRevoke = async () => {
        if (!codeToRevoke) return;

        try {
            await axiosInstance.delete(`/api/invite-codes/${codeToRevoke}`);
            setCodeToRevoke(null);
            await fetchInviteCodes();
        } catch (err) {
            console.error('Error revoking invite code:', err);
        }
    };

    const getStatusBadge = (invite) => {
        if (invite.revoked) return { text: 'Revoked', color: 'bg-danger' };
        if (invite.is_expired) return { text: 'Expired', color: 'bg-warning' };
        if (invite.used_by) return { text: 'Used', color: 'bg-success' };
        return { text: 'Active', color: 'bg-primary' };
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="display-6 mb-0">Invite Codes</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create Invite Code
                </button>
            </div>

            <div className="row g-4">
                {inviteCodes.length === 0 ? (
                    <div className="col-12">
                        <div className="card shadow-sm border">
                            <div className="card-body text-center py-5">
                                <h5 className="card-title mb-0 text-muted">No Invite Codes Found</h5>
                            </div>
                        </div>
                    </div>
                ) : (
                    inviteCodes.map((invite) => {
                        const status = getStatusBadge(invite);
                        return (
                            <div key={invite.code} className="col-12">
                                <div className="card">
                                    <div className="card-body d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="card-title mb-1">Code: {invite.code}</h5>
                                            <p className="card-text text-muted small mb-0">
                                                Message: {invite.message}
                                            </p>
                                            <p className="card-text text-muted small mb-0">
                                                Created: {new Date(invite.created_at).toLocaleString()}
                                            </p>
                                            {invite.used_by && (
                                                <p className="card-text text-muted small mb-0">
                                                    Used by: {invite.used_by}
                                                </p>
                                            )}
                                        </div>

                                        <div className="d-flex align-items-center gap-3">
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => setCodeToRevoke(invite.code)}
                                                disabled={invite.revoked || invite.is_expired}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                     fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                                    <path
                                                        d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                                    <path
                                                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                                </svg>
                                            </button>

                                            <span className={`badge ${status.color}`}>
                                                 {status.text}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Invite Code</h5>
                                <button type="button" className="btn-close"
                                        onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter invite message"
                                    value={newInviteMessage}
                                    onChange={(e) => setNewInviteMessage(e.target.value)}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary"
                                        onClick={() => setShowCreateModal(false)}>Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleCreate}>Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Confirmation Modal */}
            {codeToRevoke && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Revoke</h5>
                                <button type="button" className="btn-close"
                                        onClick={() => setCodeToRevoke(null)}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to revoke the invite code "{codeToRevoke}"?
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary"
                                        onClick={() => setCodeToRevoke(null)}>Cancel
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleRevoke}>Revoke</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InviteCodesTab;