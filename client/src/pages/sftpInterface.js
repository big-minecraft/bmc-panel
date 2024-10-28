import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFolder,
    faFile,
    faTrash,
    faFolderPlus
} from '@fortawesome/free-solid-svg-icons';
import axiosInstance from "../utils/auth";

const SFTPInterface = () => {
    const [files, setFiles] = useState([]);
    const [currentDirectory, setCurrentDirectory] = useState('/nfsshare');
    const [newFileName, setNewFileName] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [showFileContent, setShowFileContent] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [newDirName, setNewDirName] = useState('');
    const [showFileEditor, setShowFileEditor] = useState(false);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        itemToDelete: null
    });

    const [loading, setLoading] = useState({
        files: false,
        fileContent: false,
        creating: false,
        deleting: false,
        saving: false
    });

    useEffect(() => {
        fetchFiles(currentDirectory);
    }, [currentDirectory]);

    useEffect(() => {
        if (deleteModal.isOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [deleteModal.isOpen]);

    const fetchFiles = async (directory) => {
        setLoading(prev => ({...prev, files: true}));
        try {
            const response = await axiosInstance.get('/api/sftp/files', {
                params: {path: directory}
            });
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoading(prev => ({...prev, files: false}));
        }
    };

    const handleCreateFile = async () => {
        if (!newFileName.trim()) return;
        setLoading(prev => ({...prev, creating: true}));
        try {
            const filePath = `${currentDirectory}/${newFileName}`.replace(/\/+/g, '/');
            await axiosInstance.post('/api/sftp/file', {
                path: filePath,
                content: ''
            });
            fetchFiles(currentDirectory);
            setNewFileName('');
        } catch (error) {
            console.error('Error creating file:', error);
        } finally {
            setLoading(prev => ({...prev, creating: false}));
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.itemToDelete) return;

        setLoading(prev => ({...prev, deleting: true}));
        try {
            if (deleteModal.itemToDelete.type === 'd') {
                await axiosInstance.delete('/api/sftp/directory', {
                    params: {path: deleteModal.itemToDelete.path}
                });
            } else {
                await axiosInstance.delete('/api/sftp/file', {
                    params: {path: deleteModal.itemToDelete.path}
                });
            }
            setDeleteModal({isOpen: false, itemToDelete: null});
            fetchFiles(currentDirectory);
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setLoading(prev => ({...prev, deleting: false}));
        }
    };

    const handleCreateDirectory = async () => {
        if (!newDirName.trim()) return;
        setLoading(prev => ({...prev, creating: true}));
        try {
            const dirPath = `${currentDirectory}/${newDirName}`.replace(/\/+/g, '/');
            await axiosInstance.post('/api/sftp/directories', {
                path: dirPath
            });
            fetchFiles(currentDirectory);
            setNewDirName('');
        } catch (error) {
            console.error('Error creating directory:', error);
        } finally {
            setLoading(prev => ({...prev, creating: false}));
        }
    };

    const navigateToDirectory = (path) => {
        setCurrentDirectory(path);
        setShowFileContent(false);
        setShowFileEditor(false);
    };

    const handleUpdateFile = async (filePath) => {
        setLoading(prev => ({...prev, saving: true}));
        try {
            await axiosInstance.put('/api/sftp/file', {
                path: filePath,
                content: fileContent
            });
            setShowFileEditor(false);
            fetchFiles(currentDirectory);
        } catch (error) {
            console.error('Error updating file:', error);
        } finally {
            setLoading(prev => ({...prev, saving: false}));
        }
    };

    const renderBreadcrumb = () => {
        const parts = currentDirectory.split('/').filter(Boolean);
        return (
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-3 p-3 bg-light rounded">
                    <li className="breadcrumb-item">
                        <button
                            className="btn btn-link p-0 text-decoration-none"
                            onClick={() => navigateToDirectory('/nfsshare')}
                        >
                            <FontAwesomeIcon icon={faFolder} className="me-2 text-primary"/>
                            Root
                        </button>
                    </li>
                    {parts.map((dir, index) => (
                        <li
                            key={index}
                            className={`breadcrumb-item ${index === parts.length - 1 ? 'active' : ''}`}
                        >
                            {index === parts.length - 1 ? (
                                <span>
                                    <FontAwesomeIcon icon={faFolder} className="me-2 text-warning"/>
                                    {dir}
                                </span>
                            ) : (
                                <button
                                    className="btn btn-link p-0 text-decoration-none"
                                    onClick={() => navigateToDirectory('/' + parts.slice(0, index + 1).join('/'))}
                                >
                                    <FontAwesomeIcon icon={faFolder} className="me-2 text-primary"/>
                                    {dir}
                                </button>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>
        );
    };


    return (
        <div className="container-fluid py-4">
            {renderBreadcrumb()}

            <div className="row mb-4">
                <div className="col-md-6 mb-3 mb-md-0">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="New file name"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            disabled={loading.creating}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleCreateFile}
                            disabled={loading.creating}
                        >
                            {loading.creating ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status"
                                      aria-hidden="true"/>
                            ) : (
                                <FontAwesomeIcon icon={faFile} className="me-2"/>
                            )}
                            Create File
                        </button>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="New directory name"
                            value={newDirName}
                            onChange={(e) => setNewDirName(e.target.value)}
                            disabled={loading.creating}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleCreateDirectory}
                            disabled={loading.creating}
                        >
                            {loading.creating ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status"
                                      aria-hidden="true"/>
                            ) : (
                                <FontAwesomeIcon icon={faFolderPlus} className="me-2"/>
                            )}
                            Create Directory
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className={`col-md-${showFileContent || showFileEditor ? '8' : '12'}`}>
                    <div className="card shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th style={{width: '50%'}}>Name</th>
                                    <th style={{width: '20%'}}>Type</th>
                                    <th style={{width: '30%'}}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loading.files ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : files.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-4 text-muted">
                                            This directory is empty
                                        </td>
                                    </tr>
                                ) : (
                                    files.map((file, index) => (
                                        <tr key={index}>
                                            <td>
                                                {file.type === 'd' ? (
                                                    <button
                                                        className="btn btn-link text-decoration-none p-0 text-start w-100"
                                                        onClick={() => navigateToDirectory(file.path)}
                                                    >
                                                        <FontAwesomeIcon icon={faFolder} className="me-2 text-warning"/>
                                                        {file.name}
                                                    </button>
                                                ) : (
                                                    <span>
                                                        <FontAwesomeIcon icon={faFile} className="me-2 text-secondary"/>
                                                        {file.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${file.type === 'd' ? 'bg-warning' : 'bg-secondary'}`}>
                                                    {file.type === 'd' ? 'Directory' : 'File'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => setDeleteModal({
                                                        isOpen: true,
                                                        itemToDelete: file
                                                    })}
                                                    title={`Delete ${file.type === 'd' ? 'Directory' : 'File'}`}
                                                >
                                                    <FontAwesomeIcon icon={faTrash}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {(showFileContent || showFileEditor) && (
                    <div className="col-md-4">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                {loading.fileContent ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                    <textarea
                                        className="form-control mb-3"
                                        style={{minHeight: '400px', fontSize: '0.875rem'}}
                                        value={fileContent}
                                        onChange={(e) => setFileContent(e.target.value)}
                                        readOnly={!showFileEditor}
                                    />
                                        <div className="d-flex gap-2 justify-content-end">
                                            {showFileEditor && (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleUpdateFile(selectedFile.path)}
                                                    disabled={loading.saving}
                                                >
                                                    {loading.saving ? (
                                                        <span className="spinner-border spinner-border-sm me-2"
                                                              role="status" aria-hidden="true"/>
                                                    ) : null}
                                                    Save Changes
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <>
                    <div className="modal"
                         style={{display: 'block'}}
                         tabIndex="-1"
                         role="dialog"
                         aria-labelledby="deleteModalLabel"
                         aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="deleteModalLabel">Confirm Deletion</h5>
                                    <button type="button"
                                            className="btn-close"
                                            onClick={() => setDeleteModal({isOpen: false, itemToDelete: null})}
                                            aria-label="Close">
                                    </button>
                                </div>
                                <div className="modal-body">
                                    Are you sure you want to delete{' '}
                                    {deleteModal.itemToDelete?.type === 'd' ? 'directory' : 'file'}{' '}
                                    <strong>{deleteModal.itemToDelete?.name}</strong>?
                                    {deleteModal.itemToDelete?.type === 'd' && (
                                        <div className="alert alert-danger mt-3 mb-0">
                                            Warning: This will delete all contents within the directory.
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setDeleteModal({isOpen: false, itemToDelete: null})}
                                            disabled={loading.deleting}>
                                        Cancel
                                    </button>
                                    <button type="button"
                                            className="btn btn-danger"
                                            onClick={handleDelete}
                                            disabled={loading.deleting}>
                                        {loading.deleting ? (
                                            <span className="spinner-border spinner-border-sm me-2" role="status"
                                                  aria-hidden="true"/>
                                        ) : null}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show"></div>
                </>
            )}
        </div>
    );
};

export default SFTPInterface;