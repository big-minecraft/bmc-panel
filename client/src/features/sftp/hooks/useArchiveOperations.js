import { useCallback } from 'react';
import { useSFTPState, useSFTPDispatch } from '../context/SFTPContext.js';
import { useFileOperations } from './useFileOperations';
import axiosInstance from '../../../utils/auth';

export function useArchiveOperations() {
    const { selectedFiles } = useSFTPState();
    const dispatch = useSFTPDispatch();
    const { fetchFiles } = useFileOperations();

    const setLoading = useCallback((value) => {
        dispatch({
            type: 'SET_LOADING',
            payload: { key: 'archiving', value }
        });
    }, [dispatch]);

    const handleArchive = useCallback(async (file) => {
        if (!file) return;

        setLoading(true);

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
            console.error('error archiving file:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchFiles, setLoading]);

    const handleUnarchive = useCallback(async (file) => {
        if (!file || file.type === 'd' || !file.isArchived) return;

        setLoading(true);

        try {
            await axiosInstance.post('/api/sftp/unarchive', {
                path: file.path
            });
            await fetchFiles();
        } catch (error) {
            console.error('error unarchiving file:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchFiles, setLoading]);

    const handleMassArchive = useCallback(async (filesToArchive = selectedFiles) => {
        if (!filesToArchive?.length) return;

        setLoading(true);
        try {
            await axiosInstance.post('/api/sftp/archive-multiple', {
                files: filesToArchive.map(file => ({
                    path: file.path,
                    name: file.name
                }))
            });
            await fetchFiles();
            dispatch({ type: 'SET_SELECTED_FILES', payload: [] });
        } catch (error) {
            console.error('error archiving files:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedFiles, fetchFiles, dispatch, setLoading]);

    return {
        handleArchive,
        handleUnarchive,
        handleMassArchive
    };
}