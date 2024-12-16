import React, { useState, useEffect } from 'react';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSFTPState, useSFTPDispatch } from '../../context/SFTPContext';
import { MoveVertical } from 'lucide-react';

const MoveModal = ({ isOpen }) => {
    const { currentDirectory, selectedFiles, loading } = useSFTPState();
    const dispatch = useSFTPDispatch();
    const { handleMove } = useFileOperations();

    const [path, setPath] = useState('');
    const [error, setError] = useState('');
    const [targetPath, setTargetPath] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPath('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        const cleanPath = path.trim();
        if (cleanPath) {
            const fullPath = `${currentDirectory}/${cleanPath}`.replace(/\/+/g, '/');
            setTargetPath(fullPath);
        } else {
            setTargetPath(currentDirectory);
        }
    }, [path, currentDirectory]);

    const closeModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'move',
                state: { isOpen: false }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await handleMove(path);
            closeModal();
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
                            <h5 className="modal-title d-flex align-items-center">
                                <MoveVertical size={18} className="text-primary me-2" />
                                Move {selectedFiles.length} {selectedFiles.length === 1 ? 'item' : 'items'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={closeModal}
                                disabled={loading.moving}
                            />
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {error}
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
                                        disabled={loading.moving}
                                        required
                                    />
                                    <div className="form-text">
                                        Enter a relative path from the current directory
                                    </div>
                                </div>

                                <div className="mt-3 bg-light rounded p-3">
                                    <small className="text-muted">
                                        Files will be moved to:
                                        <br />
                                        <code className="text-dark">{targetPath}</code>
                                    </small>
                                </div>

                                <div className="mt-3">
                                    <small className="text-muted">
                                        Selected items:
                                        <ul className="mt-1 mb-0">
                                            {selectedFiles.slice(0, 5).map((file) => (
                                                <li key={file.path} className="font-monospace">
                                                    {file.name}
                                                </li>
                                            ))}
                                            {selectedFiles.length > 5 && (
                                                <li className="text-muted">
                                                    ...and {selectedFiles.length - 5} more
                                                </li>
                                            )}
                                        </ul>
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeModal}
                                    disabled={loading.moving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading.moving}
                                >
                                    {loading.moving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                                            Moving...
                                        </>
                                    ) : (
                                        'Move'
                                    )}
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