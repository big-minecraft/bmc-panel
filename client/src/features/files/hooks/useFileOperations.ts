import { useCallback, useRef } from 'react';
import axiosInstance from '../../../utils/auth';
import { idleUploadState, useFilesDispatch, useFilesState } from '../context/FilesContext';
import { useFileNavigation } from './useFileNavigation';
import { apiError, isExtractable, sortFiles, toUploadItems } from '../utils/fileUtils';
import { triggerBrowserDownload } from '../utils/download';

const UPLOAD_CONCURRENCY = 2;

export function useFileOperations() {
    const state = useFilesState();
    const dispatch = useFilesDispatch();
    const { handleDirectoryChange } = useFileNavigation();
    const lastReportedProgress = useRef(-1);

    const sessionId = state.currentSession?.id;

    const setLoading = useCallback((key: string, value: boolean) => {
        dispatch({ type: 'SET_LOADING', payload: { key, value } });
    }, [dispatch]);

    const notify = useCallback((message: string, type: 'error' | 'success' = 'error') => {
        dispatch({ type: 'SET_NOTICE', payload: { message, type } });
    }, [dispatch]);

    const fetchFiles = useCallback(async () => {
        if (!sessionId) return;

        setLoading('files', true);
        try {
            const response = await axiosInstance.get('/api/files/list', {
                params: { sessionId, path: state.currentDirectory }
            });

            const files = response.data.data.files.map(file => ({
                ...file,
                isArchived: file.type !== 'd' && isExtractable(file.name)
            }));

            dispatch({ type: 'SET_FILES', payload: sortFiles(files) });
            dispatch({ type: 'SET_SELECTED_FILES', payload: [] });
        } catch (error) {
            dispatch({ type: 'SET_FILES', payload: [] });
            notify(apiError(error, 'Failed to list this directory'));
        } finally {
            setLoading('files', false);
        }
    }, [sessionId, state.currentDirectory, dispatch, setLoading, notify]);

    const uploadFiles = useCallback(async (input) => {
        const items = toUploadItems(input);
        if (!items.length || !sessionId) return false;

        const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0) || 1;
        const sentBytes = items.map(() => 0);
        const failures: string[] = [];
        let completed = 0;

        lastReportedProgress.current = -1;
        dispatch({
            type: 'SET_UPLOAD_STATE',
            payload: { uploading: true, progress: 0, finishing: false, completed: 0, total: items.length }
        });

        const reportProgress = () => {
            const sent = sentBytes.reduce((sum, value) => sum + value, 0);
            const progress = Math.min(99, Math.round((sent / totalBytes) * 100));
            if (progress === lastReportedProgress.current) return;

            lastReportedProgress.current = progress;
            dispatch({
                type: 'SET_UPLOAD_STATE',
                payload: { progress, finishing: sent >= totalBytes, completed }
            });
        };

        const uploadOne = async (item, index: number) => {
            try {
                await axiosInstance.post('/api/files/upload', item.file, {
                    params: { sessionId, path: state.currentDirectory, name: item.name },
                    headers: { 'Content-Type': 'application/octet-stream' },
                    onUploadProgress: (event) => {
                        sentBytes[index] = event.loaded;
                        reportProgress();
                    }
                });

                sentBytes[index] = item.file.size;
                completed += 1;
            } catch (error) {
                failures.push(`${item.name}: ${apiError(error, 'upload failed')}`);
            }

            lastReportedProgress.current = -1;
            reportProgress();
        };

        const pending = items.map((item, index) => () => uploadOne(item, index));
        const workers = Array.from(
            { length: Math.min(UPLOAD_CONCURRENCY, pending.length) },
            async () => {
                while (pending.length > 0) await pending.shift()!();
            }
        );

        await Promise.all(workers);

        dispatch({ type: 'SET_UPLOAD_STATE', payload: idleUploadState });
        await fetchFiles();

        if (failures.length > 0) {
            notify(failures.length === 1
                ? failures[0]
                : `${failures.length} of ${items.length} uploads failed. First: ${failures[0]}`);
            return false;
        }

        notify(`Uploaded ${items.length} ${items.length === 1 ? 'file' : 'files'}`, 'success');
        return true;
    }, [sessionId, state.currentDirectory, dispatch, fetchFiles, notify]);

    const handleDelete = useCallback(async (files) => {
        if (!sessionId) return false;

        const targets = Array.isArray(files) ? files : [files];
        setLoading('deleting', true);
        try {
            await axiosInstance.post('/api/files/delete', {
                sessionId,
                paths: targets.map(file => file.path)
            });
            await fetchFiles();
            return true;
        } catch (error) {
            notify(apiError(error, 'Failed to delete'));
            return false;
        } finally {
            setLoading('deleting', false);
        }
    }, [sessionId, fetchFiles, setLoading, notify]);

    const handleMove = useCallback(async (relativePath) => {
        if (!sessionId) return;

        setLoading('moving', true);
        try {
            const targetPath = `${state.currentDirectory}/${relativePath}`.replace(/\/+/g, '/');

            await axiosInstance.post('/api/files/move', {
                sessionId,
                moves: state.selectedFiles.map(file => ({
                    sourcePath: file.path,
                    destinationPath: `${targetPath}/${file.name}`.replace(/\/+/g, '/')
                }))
            });

            await fetchFiles();
        } catch (error) {
            throw new Error(apiError(error, 'Failed to move'));
        } finally {
            setLoading('moving', false);
        }
    }, [sessionId, state.currentDirectory, state.selectedFiles, fetchFiles, setLoading]);

    const handleRename = useCallback(async (file, newName) => {
        if (!newName || !file || !sessionId) return false;

        setLoading('renaming', true);
        try {
            const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
            const newPath = `${parentDir}/${newName}`.replace(/\/+/g, '/');

            await axiosInstance.post('/api/files/move', {
                sessionId,
                moves: [{ sourcePath: file.path, destinationPath: newPath }]
            });

            await fetchFiles();
            return true;
        } catch (error) {
            throw new Error(apiError(error, 'Failed to rename'));
        } finally {
            setLoading('renaming', false);
        }
    }, [sessionId, fetchFiles, setLoading]);

    const handleMassDownload = useCallback(async (files = state.selectedFiles) => {
        const targets = Array.isArray(files) ? files : [files];
        if (!targets.length || !sessionId) return false;

        setLoading('downloading', true);
        try {
            const response = await axiosInstance.post('/api/files/download-token', {
                sessionId,
                files: targets.map(file => ({ path: file.path, name: file.name, type: file.type }))
            });

            triggerBrowserDownload(`/api/files/download?token=${encodeURIComponent(response.data.data.token)}`);
            return true;
        } catch (error) {
            notify(apiError(error, 'Failed to start download'));
            return false;
        } finally {
            setLoading('downloading', false);
        }
    }, [sessionId, state.selectedFiles, setLoading, notify]);

    const handleDownload = useCallback(
        (file) => handleMassDownload([file]),
        [handleMassDownload]
    );

    const handleSaveFile = useCallback(async (file, content) => {
        if (!sessionId) return false;

        setLoading('saving', true);
        try {
            await axiosInstance.post('/api/files/update', {
                sessionId,
                path: file.path,
                content
            });
            await fetchFiles();
            return true;
        } catch (error) {
            notify(apiError(error, 'Failed to save file'));
            return false;
        } finally {
            setLoading('saving', false);
        }
    }, [sessionId, fetchFiles, setLoading, notify]);

    const handleFileClick = useCallback(async (file) => {
        if (!sessionId) return;

        if (file.type === 'd') {
            handleDirectoryChange(file.path);
            return;
        }

        if (file.isArchived || !file.isText) return;

        try {
            const response = await axiosInstance.post('/api/files/get-content', {
                sessionId,
                path: file.path
            });

            dispatch({
                type: 'SET_MODAL_STATE',
                payload: {
                    modal: 'editor',
                    state: { isOpen: true, file, content: response.data.data.content }
                }
            });
        } catch (error) {
            notify(apiError(error, 'Failed to open file'));
        }
    }, [sessionId, dispatch, handleDirectoryChange, notify]);

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
