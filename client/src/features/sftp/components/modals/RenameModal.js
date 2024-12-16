import React, { useState, useEffect } from 'react';
import { useSFTPState, useSFTPDispatch } from '../../context/SFTPContext';
import { useFileOperations } from '../../hooks/useFileOperations';
import { Pencil } from 'lucide-react';

const RenameModal = ({ isOpen, file }) => {
    const { loading } = useSFTPState();
    const dispatch = useSFTPDispatch();
    const { handleRename } = useFileOperations();

    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && file) {
            setNewName(file.name);
            setError('');
        }
    }, [isOpen, file]);

    const closeModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'rename',
                state: { isOpen: false, file: null }
            }
        });
    };

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
            await handleRename(file, newName);
            closeModal();
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
                            <h5 className="modal-title d-flex align-items-center">
                                <Pencil size={18} className="text-primary me-2" />
                                Rename {file.type === 'd' ? 'Directory' : 'File'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={closeModal}
                                disabled={loading.renaming}
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
                                    <label className="form-label">New Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        disabled={loading.renaming}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="mt-3 bg-light rounded p-3">
                                    <small className="text-muted">
                                        Current path:
                                        <br />
                                        <code className="text-dark">{file.path}</code>
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeModal}
                                    disabled={loading.renaming}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading.renaming}
                                >
                                    {loading.renaming ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                                            Renaming...
                                        </>
                                    ) : (
                                        'Rename'
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

export default RenameModal;