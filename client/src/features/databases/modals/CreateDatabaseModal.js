import React from 'react';

export const CreateDatabaseModal = ({ show, onClose, databaseName, onDatabaseNameChange, onCreate }) => {
    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Create New Database</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter database name"
                            value={databaseName}
                            onChange={(e) => onDatabaseNameChange(e.target.value)}
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={onCreate}>Create</button>
                    </div>
                </div>
            </div>
        </div>
    );
};