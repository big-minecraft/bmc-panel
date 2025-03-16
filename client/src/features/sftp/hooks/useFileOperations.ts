import {useCallback} from 'react';
import axiosInstance from '../../../utils/auth';
import {useSFTPState, useSFTPDispatch} from '../context/SFTPContext';
import {useFileNavigation} from "./useFileNavigation";
import {useDeployButton} from "../context/DeployButtonContext.tsx";
import {Enum} from "../../../../../shared/enum/enum.ts";

export function useFileOperations() {
    const state = useSFTPState();
    const dispatch = useSFTPDispatch();
    const {handleDirectoryChange} = useFileNavigation();
    const { setIsVisible } = useDeployButton();

    const fetchFiles = useCallback(async () => {
        dispatch({type: 'SET_LOADING', payload: {key: 'files', value: true}});
        try {
            const response = await axiosInstance.get('/api/sftp/files', {
                params: {path: state.currentDirectory}
            });

            // TODO: this code should probably be moved to handleDirectoryChange somehow (prob when sftp ui is redone)
            const deploymentType = Enum.DeploymentType.fromIndex(response.data.data.deploymentTypeIndex);
            setIsVisible(deploymentType === Enum.DeploymentType.SCALABLE);

            const processedFiles = response.data.data.files
                .map(file => ({
                    ...file,
                    isArchived: file.type !== 'd' && (
                        file.name.endsWith('.tar') ||
                        file.name.endsWith('.gz') ||
                        file.name.endsWith('.zip') ||
                        file.name.endsWith('.rar') ||
                        file.name.endsWith('.7z') ||
                        file.name.endsWith('.tar.gz')
                    )
                }))
                .sort((a, b) => {
                    if (a.type === 'd' && b.type !== 'd') return -1;
                    if (a.type !== 'd' && b.type === 'd') return 1;
                    return a.name.localeCompare(b.name);
                });

            dispatch({type: 'SET_FILES', payload: processedFiles});
            dispatch({type: 'SET_SELECTED_FILES', payload: []});
        } catch (error) {
            console.error('error fetching files:', error);
        } finally {
            dispatch({type: 'SET_LOADING', payload: {key: 'files', value: false}});
        }
    }, [state.currentDirectory, dispatch]);

    const uploadFiles = useCallback(async (files: FileList | File[]) => {
        if (!files?.length) return;

        dispatch({
            type: 'SET_UPLOAD_STATE',
            payload: {uploading: true, progress: 0, error: null}
        });

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        formData.append('path', state.currentDirectory);

        try {
            await axiosInstance.post('/api/sftp/upload', formData, {
                headers: {'Content-Type': 'multipart/form-data'},
                onUploadProgress: (event) => {
                    const progress = Math.round((event.loaded * 100) / event.total);
                    dispatch({
                        type: 'SET_UPLOAD_STATE',
                        payload: {progress}
                    });
                },
            });
            await fetchFiles();
        } catch (error) {
            console.error('error uploading files:', error);
            const errorMessage = error.response?.data?.message || 'Failed to upload files. Please try again.';
            dispatch({
                type: 'SET_UPLOAD_STATE',
                payload: {error: errorMessage}
            });
        } finally {
            dispatch({
                type: 'SET_UPLOAD_STATE',
                payload: {uploading: false, progress: 0}
            });
        }
    }, [state.currentDirectory, dispatch, fetchFiles]);

    const handleDelete = useCallback(async (files) => {
        const filesToDelete = Array.isArray(files) ? files : [files];
        dispatch({type: 'SET_LOADING', payload: {key: 'deleting', value: true}});

        try {
            for (const file of filesToDelete) {
                const endpoint = file.type === 'd' ? 'directory' : 'file';
                await axiosInstance.delete(`/api/sftp/${endpoint}`, {
                    params: {path: file.path}
                });
            }
            await fetchFiles();
        } catch (error) {
            console.error('error deleting files:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete files');
        } finally {
            dispatch({type: 'SET_LOADING', payload: {key: 'deleting', value: false}});
        }
    }, [dispatch, fetchFiles]);

    const handleMove = useCallback(async (relativePath) => {
        dispatch({type: 'SET_LOADING', payload: {key: 'moving', value: true}});
        try {
            const targetPath = `${state.currentDirectory}/${relativePath}`.replace(/\/+/g, '/');

            await Promise.all(state.selectedFiles.map(file =>
                axiosInstance.post('/api/sftp/move', {
                    sourcePath: file.path,
                    targetPath: `${targetPath}/${file.name}`
                })
            ));

            await fetchFiles();
        } catch (error) {
            console.error('error moving files:', error);
            throw new Error(error.response?.data?.message || 'Failed to move files');
        } finally {
            dispatch({type: 'SET_LOADING', payload: {key: 'moving', value: false}});
        }
    }, [state.currentDirectory, state.selectedFiles, dispatch, fetchFiles]);

    const handleRename = useCallback(async (file, newName) => {
        if (!newName || !file) return;

        dispatch({type: 'SET_LOADING', payload: {key: 'renaming', value: true}});

        try {
            const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
            const newPath = `${parentDir}/${newName}`.replace(/\/+/g, '/');

            await axiosInstance.post('/api/sftp/move', {
                sourcePath: file.path,
                targetPath: newPath
            });

            await fetchFiles();

            dispatch({
                type: 'SET_SELECTED_FILES',
                payload: state.selectedFiles.map(selectedFile =>
                    selectedFile.path === file.path
                        ? {...selectedFile, path: newPath, name: newName}
                        : selectedFile
                )
            });

            return true;
        } catch (error) {
            console.error('Error renaming:', error);
            throw new Error(error.response?.data?.message || 'Failed to rename. Please try again.');
        } finally {
            dispatch({type: 'SET_LOADING', payload: {key: 'renaming', value: false}});
        }
    }, [dispatch, fetchFiles, state.selectedFiles]);

    const handleDownload = useCallback(async (file) => {
        dispatch({type: 'SET_LOADING', payload: {key: 'downloading', value: true}});
        try {
            if (file.type === 'd') {
                const response = await axiosInstance.post('/api/sftp/download-multiple', {
                    files: [{path: file.path, name: file.name}]
                }, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${file.name}.zip`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                const response = await axiosInstance.get('/api/sftp/download', {
                    params: {path: file.path},
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', file.name);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('error downloading file:', error);
            throw new Error(error.response?.data?.message || 'Failed to download file');
        } finally {
            dispatch({type: 'SET_LOADING', payload: {key: 'downloading', value: false}});
        }
    }, [dispatch]);

    const handleMassDownload = useCallback(async (filesToDownload = state.selectedFiles) => {
        if (!filesToDownload?.length) return;

        dispatch({type: 'SET_LOADING', payload: {key: 'downloading', value: true}});
        try {
            const files = Array.isArray(filesToDownload) ? filesToDownload : [filesToDownload];

            if (files.length === 1) {
                await handleDownload(files[0]);
            } else {
                const response = await axiosInstance.post('/api/sftp/download-multiple', {
                    files: files.map(file => ({
                        path: file.path,
                        name: file.name
                    }))
                }, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'files.zip');
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('error downloading files:', error);
        } finally {
            dispatch({type: 'SET_LOADING', payload: {key: 'downloading', value: false}});
        }
    }, [state.selectedFiles, dispatch, handleDownload]);

    const handleSaveFile = useCallback(async (file, content) => {
        dispatch({type: 'SET_LOADING', payload: {key: 'saving', value: true}});
        try {
            await axiosInstance.patch('/api/sftp/file/content', {
                path: file.path,
                content: content
            });
            await fetchFiles();
        } catch (error) {
            console.error('error saving file:', error);
            throw new Error(error.response?.data?.message || 'Failed to save file');
        } finally {
            dispatch({type: 'SET_LOADING', payload: {key: 'saving', value: false}});
        }
    }, [dispatch, fetchFiles]);

    const handleFileClick = useCallback(async (file) => {
        if (file.type === 'd') {
            handleDirectoryChange(file.path);
        } else if (file.type !== 'd' && !file.isArchived) {
            try {
                const response = await axiosInstance.get('/api/sftp/file/content', {
                    params: {path: file.path}
                });

                let fileContent = '';
                if (response.data.data && response.data.data.content) {
                    if (typeof response.data.data.content === 'string') {
                        fileContent = response.data.data.content;
                    } else if (response.data.data.content.data) {
                        fileContent = new TextDecoder().decode(new Uint8Array(response.data.data.content.data));
                    }
                }

                dispatch({
                    type: 'SET_MODAL_STATE',
                    payload: {
                        modal: 'editor',
                        state: {isOpen: true, file, content: fileContent}
                    }
                });
            } catch (error) {
                console.error('error fetching file content:', error);
            }
        }
    }, [dispatch, handleDirectoryChange]);

    return {
        fetchFiles,
        uploadFiles,
        handleDelete,
        handleMove,
        handleRename,
        handleDownload,
        handleMassDownload,
        handleSaveFile,
        handleFileClick
    };
}