import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faPen,
    faBox,
    faBoxOpen,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useArchiveOperations } from '../../hooks/useArchiveOperations';
import { useSFTPState, useSFTPDispatch } from '../../context/SFTPContext';

const FileActions = ({ file }) => {
    const { loading } = useSFTPState();
    const dispatch = useSFTPDispatch();
    const { handleDownload } = useFileOperations();
    const { handleArchive, handleUnarchive } = useArchiveOperations();

    const actionButtonStyle = {
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.25rem 0'
    };

    const isLoading = loading.downloading || loading.archiving || loading.deleting;

    const openRenameModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'rename',
                state: { isOpen: true, file }
            }
        });
    };

    const openDeleteModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'delete',
                state: { isOpen: true, files: [file] }
            }
        });
    };

    return (
        <div className="btn-group">
            <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleDownload(file)}
                title={`Download ${file.type === 'd' ? 'Directory' : 'File'}`}
                style={actionButtonStyle}
                disabled={isLoading}
            >
                <FontAwesomeIcon icon={faDownload} fixedWidth />
            </button>

            <button
                className="btn btn-outline-secondary btn-sm ms-2"
                onClick={openRenameModal}
                title={`Rename ${file.type === 'd' ? 'Directory' : 'File'}`}
                style={actionButtonStyle}
                disabled={isLoading}
            >
                <FontAwesomeIcon icon={faPen} fixedWidth />
            </button>

            {file.isArchived ? (
                <button
                    className="btn btn-outline-info btn-sm ms-2"
                    onClick={() => handleUnarchive(file)}
                    title={`Unarchive ${file.type === 'd' ? 'Directory' : 'File'}`}
                    style={actionButtonStyle}
                    disabled={isLoading}
                >
                    <FontAwesomeIcon icon={faBoxOpen} fixedWidth />
                </button>
            ) : (
                <button
                    className="btn btn-outline-secondary btn-sm ms-2"
                    onClick={() => handleArchive(file)}
                    title={`Archive ${file.type === 'd' ? 'Directory' : 'File'}`}
                    style={actionButtonStyle}
                    disabled={isLoading}
                >
                    <FontAwesomeIcon icon={faBox} fixedWidth />
                </button>
            )}

            <button
                className="btn btn-outline-danger btn-sm ms-2"
                onClick={openDeleteModal}
                title={`Delete ${file.type === 'd' ? 'Directory' : 'File'}`}
                style={actionButtonStyle}
                disabled={isLoading}
            >
                <FontAwesomeIcon icon={faTrash} fixedWidth />
            </button>
        </div>
    );
};

export default FileActions;