import React, { useState } from 'react';
import { Check, Trash2, MoveVertical, Download, Archive, X } from 'lucide-react';
import DeleteModal from "./deleteModal";

const ActionOverlay = ({
   selectedFiles,
   onClose,
   onDelete,
   onMove,
   onDownload,
   onArchive,
   loading
}) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const selectedCount = selectedFiles.length;

    if (selectedCount === 0) return null;

    const handleDelete = () => {
        onDelete();
        setShowDeleteModal(false);
    };

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    minWidth: '500px'
                }}
            >
                <div className="bg-white shadow-lg rounded-pill py-2 px-4 border d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center me-3">
                            <Check size={16} className="text-primary me-2" />
                            <span className="text-secondary small fw-medium">
                                {selectedCount} selected
                            </span>
                        </div>

                        <div className="vr mx-2"></div>

                        <div className="btn-group">
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                disabled={loading}
                                className="btn btn-sm btn-outline-danger rounded-pill px-3 me-2"
                                title="Delete"
                            >
                                <Trash2 size={18} className="me-1" />
                                <span className="d-none d-sm-inline">Delete</span>
                            </button>

                            <button
                                onClick={onMove}
                                disabled={loading}
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3 me-2"
                                title="Move"
                            >
                                <MoveVertical size={18} className="me-1" />
                                <span className="d-none d-sm-inline">Move</span>
                            </button>

                            <button
                                onClick={onDownload}
                                disabled={loading}
                                className="btn btn-sm btn-outline-primary rounded-pill px-3 me-2"
                                title="Download"
                            >
                                <Download size={18} className="me-1" />
                                <span className="d-none d-sm-inline">Download</span>
                            </button>

                            <button
                                onClick={onArchive}
                                disabled={loading}
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                title="Archive"
                            >
                                <Archive size={18} className="me-1" />
                                <span className="d-none d-sm-inline">Archive</span>
                            </button>
                        </div>
                    </div>

                    <div className="d-flex align-items-center">
                        <div className="vr mx-2"></div>
                        <button
                            onClick={onClose}
                            className="btn btn-sm btn-outline-secondary rounded-circle p-2"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <DeleteModal
                isOpen={showDeleteModal}
                selectedFiles={selectedFiles}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                loading={loading}
            />
        </>
    );
};

export default ActionOverlay;