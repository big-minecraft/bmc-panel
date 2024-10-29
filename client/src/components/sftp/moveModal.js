import React, { useState, useEffect } from 'react';

const MoveModal = ({ isOpen, onClose, onConfirm, selectedFiles, currentDirectory }) => {
    const [path, setPath] = useState('');
    const [error, setError] = useState('');
    const [targetPath, setTargetPath] = useState('');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPath('');
            setError('');
        }
    }, [isOpen]);

    // Update target path preview whenever path input changes
    useEffect(() => {
        const cleanPath = path.trim();
        if (cleanPath) {
            const fullPath = `${currentDirectory}/${cleanPath}`.replace(/\/+/g, '/');
            setTargetPath(fullPath);
        } else {
            setTargetPath(currentDirectory);
        }
    }, [path, currentDirectory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await onConfirm(path);
            setPath('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to move files. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                Move {selectedFiles.length} item{selectedFiles.length !== 1 ? 's' : ''}
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
                                    <label className="form-label">Destination Path</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter relative path (e.g., folder/subfolder)"
                                        value={path}
                                        onChange={(e) => setPath(e.target.value)}
                                        required
                                    />
                                    <small className="form-text text-muted">
                                        Enter a relative path from the current directory
                                    </small>
                                </div>

                                <div className="mt-3 p-2 bg-light rounded">
                                    <small className="text-muted">
                                        Files will be moved to:
                                        <br />
                                        <span className="font-monospace">{targetPath}</span>
                                    </small>
                                </div>

                                <div className="mt-3">
                                    <small className="text-muted">
                                        Selected files:
                                        <ul className="mt-1 mb-0">
                                            {selectedFiles.map((file, index) => (
                                                <li key={index} className="font-monospace small">
                                                    {file.name}
                                                </li>
                                            )).slice(0, 5)}
                                            {selectedFiles.length > 5 && (
                                                <li>...and {selectedFiles.length - 5} more</li>
                                            )}
                                        </ul>
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
                                    Move
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

export default MoveModal;