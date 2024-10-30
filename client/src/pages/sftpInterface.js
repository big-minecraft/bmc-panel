import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from "../utils/auth";
import Breadcrumb from "../components/sftp/breadcrumb";
import CreateActions from "../components/sftp/createActions";
import FileUpload from "../components/sftp/fileUpload";
import FilesList from "../components/sftp/filesList";
import DeleteModal from "../components/sftp/deleteModal";
import ActionOverlay from "../components/sftp/actionOverlay";
import useDragAndDrop from "../components/sftp/useDragAndDrop";
import DragDropOverlay from "../components/sftp/dragDropOverlay";
import MoveModal from "../components/sftp/moveModal";
import RenameModal from "../components/sftp/renameModal";
import MonacoEditorModal from "../components/sftp/monacoEditorModal";

const SFTPInterface = () => {
    const location = useLocation();

    const getInitialDirectory = () => {
        const urlPath = location.pathname.replace('/files', '') || '/';
        const decodedPath = decodeURIComponent(urlPath);

        if (!decodedPath || decodedPath === '/') {
            return '/nfsshare';
        }

        return `/nfsshare${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;
    };

    const [files, setFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [currentDirectory, setCurrentDirectory] = useState(getInitialDirectory());

    const handleDirectoryChange = (newPath) => {
        const normalizedPath = newPath.startsWith('/nfsshare')
            ? newPath
            : `/nfsshare${newPath.startsWith('/') ? newPath : '/' + newPath}`;
        const urlPath = normalizedPath.replace('/nfsshare', '');
        const encodedPath = encodeURIComponent(urlPath).replace(/%2F/g, '/');
        window.history.pushState(null, '', `/files${encodedPath}`);

        setCurrentDirectory(normalizedPath);
    };

    const [newFileName, setNewFileName] = useState('');
    const [newDirName, setNewDirName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [moveModal, setMoveModal] = useState({ isOpen: false });
    const [uploadError, setUploadError] = useState(null);
    const [renameModal, setRenameModal] = useState({ isOpen: false, file: null });
    const [loading, setLoading] = useState({
        files: false,
        creating: false,
        deleting: false,
        moving: false,
        downloading: false,
        archiving: false,
        renaming: false
    });
    const [deleteModalState, setDeleteModalState] = useState({
        isOpen: false,
        files: []
    });
    const [editorModal, setEditorModal] = useState({
        isOpen: false,
        file: null,
        content: ''
    });

    useEffect(() => {
        const newDirectory = getInitialDirectory();
        if (newDirectory !== currentDirectory) {
            setCurrentDirectory(newDirectory);
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchFiles();
    }, [currentDirectory]);
    const fetchFiles = async () => {
        setLoading(prev => ({ ...prev, files: true }));
        try {
            const response = await axiosInstance.get('/api/sftp/files', {
                params: { path: currentDirectory }
            });

            const processedFiles = response.data.map(file => ({
                ...file,
                isArchived: file.type !== 'd' && (
                    file.name.endsWith('.tar') ||
                    file.name.endsWith('.gz') ||
                    file.name.endsWith('.zip') ||
                    file.name.endsWith('.rar') ||
                    file.name.endsWith('.7z') ||
                    file.name.endsWith('.tar.gz')
                )
            })).sort((a, b) => {
                if (a.type === 'd' && b.type !== 'd') return -1;
                if (a.type !== 'd' && b.type === 'd') return 1;
                return a.name.localeCompare(b.name);
            });

            setFiles(processedFiles);
            setSelectedFiles([]);
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoading(prev => ({ ...prev, files: false }));
        }
    };

    const handleFileUpload = async (files) => {
        if (!files?.length) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        formData.append('path', currentDirectory);

        try {
            await axiosInstance.post('/api/sftp/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (event) => {
                    const progress = Math.round((event.loaded * 100) / event.total);
                    setUploadProgress(progress);
                },
            });
            fetchFiles();
        } catch (error) {
            console.error('Error uploading files:', error);
            const errorMessage = error.response?.data?.message || 'Failed to upload files. Please try again.';
            setUploadError(errorMessage);

            setTimeout(() => {
                setUploadError(null);
            }, 5000);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async () => {
        setLoading(prev => ({...prev, deleting: true}));

        try {
            for (const file of deleteModalState.files) {
                const endpoint = file.type === 'd' ? 'directory' : 'file';
                await axiosInstance.delete(`/api/sftp/${endpoint}`, {
                    params: { path: file.path }
                });
            }

            setDeleteModalState({ isOpen: false, files: [] });
            setSelectedFiles([]);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setLoading(prev => ({...prev, deleting: false}));
        }
    };

    const openDeleteModal = (files) => {
        const filesToDelete = Array.isArray(files) ? files : [files];
        setDeleteModalState({
            isOpen: true,
            files: filesToDelete
        });
    };

    const handleMove = async (relativePath) => {
        setLoading(prev => ({...prev, moving: true}));
        try {
            const targetPath = `${currentDirectory}/${relativePath}`.replace(/\/+/g, '/');

            await Promise.all(selectedFiles.map(file =>
                axiosInstance.post('/api/sftp/move', {
                    sourcePath: file.path,
                    targetPath: `${targetPath}/${file.name}`
                })
            ));

            setMoveModal({ isOpen: false });
            setSelectedFiles([]);
            fetchFiles();
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to move files');
        } finally {
            setLoading(prev => ({...prev, moving: false}));
        }
    };

    const handleMassDownload = async (filesToDownload = selectedFiles) => {
        if (!filesToDownload || filesToDownload.length === 0) return;

        const files = Array.isArray(filesToDownload) ? filesToDownload : [filesToDownload];

        setLoading(prev => ({...prev, downloading: true}));
        try {
            if (files.length === 1) {
                const file = files[0];
                if (file.type === 'd') {
                    const response = await axiosInstance.post('/api/sftp/download-multiple', {
                        files: [file]
                    }, {
                        responseType: 'blob'
                    });

                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${file.name}.zip`);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    await handleDownload(file);
                }
            } else {
                const response = await axiosInstance.post('/api/sftp/download-multiple', {
                    files: files.map(file => ({
                        path: file.path,
                        name: file.name
                    }))
                }, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'files.zip');
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading files:', error);
        } finally {
            setLoading(prev => ({...prev, downloading: false}));
        }
    };

    const handleDownload = async (file) => {
        if (file.type === 'd') {
            return handleMassDownload([file]);
        }

        try {
            const response = await axiosInstance.get('/api/sftp/download', {
                params: { path: file.path },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const handleArchive = async (file) => {
        if (!file) return;

        setLoading(prev => ({...prev, archiving: true}));

        try {
            if (file.type === 'd') {
                await axiosInstance.post('/api/sftp/archive-multiple', {
                    files: [{
                        path: file.path,
                        name: file.name
                    }]
                });
            } else {
                await axiosInstance.post('/api/sftp/archive', {
                    path: file.path
                });
            }

            await fetchFiles();
        } catch (error) {
            console.error('Error archiving file:', error);
        } finally {
            setLoading(prev => ({...prev, archiving: false}));
        }
    };

    const handleMassArchive = async (filesToArchive = selectedFiles) => {
        if (!filesToArchive || filesToArchive.length === 0) return;

        const files = Array.isArray(filesToArchive) ? filesToArchive : [filesToArchive];

        try {
            await setLoading(prev => ({...prev, archiving: true}));

            if (files.length === 1) {
                const singleFile = files[0];
                await handleArchive(singleFile);
            } else {
                await axiosInstance.post('/api/sftp/archive-multiple', {
                    files: files.map(file => ({
                        path: file.path,
                        name: file.name
                    }))
                });
                await fetchFiles();
            }

            setSelectedFiles([]);
        } catch (error) {
            console.error('Error archiving files:', error);
        } finally {
            await setLoading(prev => ({...prev, archiving: false}));
        }
    };


    const handleUnarchive = async (file) => {
        if (!file || file.type === 'd' || !file.isArchived) return;

        setLoading(prev => ({...prev, archiving: true}));

        try {
            await axiosInstance.post('/api/sftp/unarchive', {
                path: file.path
            });
            await fetchFiles();
        } catch (error) {
            console.error('Error unarchiving file:', error);
        } finally {
            setLoading(prev => ({...prev, archiving: false}));
        }
    };

    const handleSelectFile = (file) => {
        setSelectedFiles(prev => {
            const isSelected = prev.some(f => f.path === file.path);
            if (isSelected) {
                return prev.filter(f => f.path !== file.path);
            } else {
                return [...prev, file];
            }
        });
    };

    const handleSelectAllFiles = (selected) => {
        setSelectedFiles(selected ? [...files] : []);
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

            setNewFileName('');
            fetchFiles();
        } catch (error) {
            console.error('Error creating file:', error);
        } finally {
            setLoading(prev => ({...prev, creating: false}));
        }
    };

    const handleCreateDir = async () => {
        if (!newDirName.trim()) return;
        setLoading(prev => ({ ...prev, creating: true }));
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
            setLoading(prev => ({ ...prev, creating: false }));
        }
    };

    const handleRename = async (file, newName) => {
        if (!newName || !file) return;

        setLoading(prev => ({...prev, renaming: true}));

        try {
            const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));

            const newPath = `${parentDir}/${newName}`.replace(/\/+/g, '/');

            await axiosInstance.post('/api/sftp/move', {
                sourcePath: file.path,
                targetPath: newPath
            });

            await fetchFiles();

            setSelectedFiles(prev =>
                prev.map(selectedFile =>
                    selectedFile.path === file.path
                        ? {...selectedFile, path: newPath, name: newName}
                        : selectedFile
                )
            );

            return true;
        } catch (error) {
            console.error('Error renaming:', error);
            throw new Error(error.response?.data?.message || 'Failed to rename. Please try again.');
        } finally {
            setLoading(prev => ({...prev, renaming: false}));
        }
    };

    const handleEditFile = async (file) => {
        try {
            const response = await axiosInstance.get('/api/sftp/file', {
                params: { path: file.path }
            });

            let fileContent = '';
            if (response.data && response.data.content) {
                if (Array.isArray(response.data.content.data)) {
                    fileContent = Buffer.from(response.data.content.data).toString('utf-8');
                } else if (typeof response.data.content === 'string') {
                    fileContent = response.data.content;
                }
            }

            setEditorModal({
                isOpen: true,
                file,
                content: fileContent
            });
        } catch (error) {
            console.error('Error fetching file content:', error);
        }
    };

    const handleSaveFile = async (content) => {
        try {
            await axiosInstance.post('/api/sftp/file', {
                path: editorModal.file.path,
                content: content
            });
            setEditorModal({ isOpen: false, file: null, content: '' });
            await fetchFiles();
        } catch (error) {
            console.error('Error saving file:', error);
        }
    };

    const dragActive = useDragAndDrop(handleFileUpload);

    return (
        <div className="container-fluid py-4">
            {uploadError && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    {uploadError}
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => setUploadError(null)}
                    ></button>
                </div>
            )}

            <DragDropOverlay active={dragActive} />
            <Breadcrumb
                currentDirectory={currentDirectory}
                onNavigate={handleDirectoryChange}
            />

            <div className="row mb-4">
                <CreateActions
                    newFileName={newFileName}
                    newDirName={newDirName}
                    onFileNameChange={setNewFileName}
                    onDirNameChange={setNewDirName}
                    onCreateFile={handleCreateFile}
                    onCreateDir={handleCreateDir}
                    loading={loading.creating}
                />
                <FileUpload
                    onUpload={handleFileUpload}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                />
            </div>

            <div className="row">
                <div className="col-12">
                    <FilesList
                        files={files}
                        loading={loading.files || loading.archiving || loading.downloading}
                        onNavigate={handleDirectoryChange}
                        onDelete={(file) => openDeleteModal(file)}
                        onDownload={(file) => handleMassDownload([file])}
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                        selectedFiles={selectedFiles}
                        onSelectFile={handleSelectFile}
                        onSelectAllFiles={handleSelectAllFiles}
                        onArchive={handleArchive}
                        onUnarchive={handleUnarchive}
                        onRename={(file) => setRenameModal({ isOpen: true, file })}
                        onEdit={handleEditFile}
                    />
                </div>
            </div>

            <DeleteModal
                isOpen={deleteModalState.isOpen}
                selectedFiles={deleteModalState.files}
                onClose={() => setDeleteModalState({ isOpen: false, files: [] })}
                onConfirm={handleDelete}
                loading={loading.deleting}
            />

            <MoveModal
                isOpen={moveModal.isOpen}
                onClose={() => setMoveModal({ isOpen: false })}
                onConfirm={handleMove}
                selectedFiles={selectedFiles}
                currentDirectory={currentDirectory}
            />

            <RenameModal
                isOpen={renameModal.isOpen}
                file={renameModal.file}
                onClose={() => setRenameModal({ isOpen: false, file: null })}
                onConfirm={handleRename}
            />

            <ActionOverlay
                selectedFiles={selectedFiles}
                onClose={() => setSelectedFiles([])}
                onDelete={openDeleteModal}
                onMove={() => setMoveModal({ isOpen: true })}
                onDownload={() => handleMassDownload(selectedFiles)}
                onArchive={() => handleMassArchive(selectedFiles)}
                loading={loading.archiving}
            />

            <MonacoEditorModal
                isOpen={editorModal.isOpen}
                onClose={() => setEditorModal({ isOpen: false, file: null, content: '' })}
                onSave={handleSaveFile}
                initialContent={editorModal.content}
                fileName={editorModal.file?.name}
            />
        </div>
    );
};

export default SFTPInterface;