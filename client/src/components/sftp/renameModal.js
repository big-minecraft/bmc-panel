import React, { useState, useEffect } from 'react';

const RenameModal = ({ isOpen, onClose, onConfirm, file }) => {
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && file) {
            setNewName(file.name);
            setError('');
        }
    }, [isOpen, file]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newName.trim() === '') {
            setError('Name cannot be empty');
            return;
        }

        if (newName === file.name) {
            setError('New name must be different from current name');
            return;
        }

        const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
        if (invalidChars.test(newName)) {
            setError('Name contains invalid characters');
            return;
        }

        try {
            await onConfirm(file, newName);
            setNewName('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to rename. Please try again.');
        }
    };

    if (!isOpen || !file) return null;

    return (
        <>
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                Rename {file.type === 'd' ? 'Directory' : 'File'}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-circle me-2" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                                        </svg>
                                        <div>{error}</div>
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">New Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="mt-3 p-2 bg-light rounded">
                                    <small className="text-muted">
                                        Current path:
                                        <br />
                                        <span className="font-monospace">{file.path}</span>
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Rename
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show" />
        </>
    );
};

export default RenameModal;