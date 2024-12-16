import React from 'react';
import { Trash2 } from 'lucide-react';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useSFTPState, useSFTPDispatch } from '../../context/SFTPContext';

const DeleteModal = ({ isOpen, files }) => {
    const { loading } = useSFTPState();
    const dispatch = useSFTPDispatch();
    const { handleDelete } = useFileOperations();

    if (!isOpen) return null;

    const hasDirectories = files.some(file => file.type === 'd');
    const itemCount = files.length;

    const closeModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'delete',
                state: { isOpen: false, files: [] }
            }
        });
    };

    const onConfirm = async () => {
        await handleDelete(files);
        closeModal();
    };

    return (
        <>
            <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title d-flex align-items-center">
                                <Trash2 size={18} className="text-danger me-2" />
                                Delete {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={closeModal}
                                disabled={loading.deleting}
                            />
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete the following {itemCount === 1 ? 'item' : 'items'}?</p>

                            <div className="border rounded p-3 bg-light mb-3">
                                <ul className="list-unstyled mb-0 small">
                                    {files.slice(0, 5).map((file) => (
                                        <li key={file.path} className="d-flex align-items-center mb-1">
                                            {file.type === 'd' ? (
                                                <i className="bi bi-folder-fill text-warning me-2"></i>
                                            ) : (
                                                <i className="bi bi-file-text me-2"></i>
                                            )}
                                            <span className="font-monospace">{file.name}</span>
                                        </li>
                                    ))}
                                    {itemCount > 5 && (
                                        <li className="text-muted mt-1">
                                            ...and {itemCount - 5} more items
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {hasDirectories && (
                                <div className="alert alert-danger d-flex align-items-center mb-0">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <div>
                                        Warning: One or more directories will be deleted along with all their contents.
                                        This action cannot be undone.
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeModal}
                                disabled={loading.deleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={onConfirm}
                                disabled={loading.deleting}
                            >
                                {loading.deleting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>Delete {itemCount > 0 && itemCount} {itemCount === 1 ? 'item' : 'items'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show" />
        </>
    );
};

export default DeleteModal;