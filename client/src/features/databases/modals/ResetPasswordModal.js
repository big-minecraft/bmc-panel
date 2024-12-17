import React from 'react';

export const ResetPasswordModal = ({ databaseName, onClose, onConfirm }) => {
    if (!databaseName) return null;

    return (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Confirm Password Reset</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        Are you sure you want to reset the password for database "{databaseName}"? This action cannot be undone.
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className="btn btn-warning" onClick={onConfirm}>Reset Password</button>
                    </div>
                </div>
            </div>
        </div>
    );
};