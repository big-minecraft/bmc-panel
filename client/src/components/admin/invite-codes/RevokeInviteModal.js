import React from 'react';

const RevokeInviteModal = ({ code, onClose, onRevoke }) => {
    if (!code) return null;

    return (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Confirm Revoke</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        Are you sure you want to revoke the invite code "{code}"?
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => onRevoke(code)}>
                            Revoke
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevokeInviteModal;