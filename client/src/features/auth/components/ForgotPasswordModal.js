import React from 'react';

export const ForgotPasswordModal = ({ show, onClose }) => (
    <>
        <div className={`modal fade ${show ? 'show' : ''}`}
             tabIndex="-1"
             style={{ display: show ? 'block' : 'none' }}
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Password Reset</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <p>Please contact your system administrator to reset your password.</p>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onClose}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
        {show && <div className="modal-backdrop fade show" onClick={onClose}></div>}
    </>
);