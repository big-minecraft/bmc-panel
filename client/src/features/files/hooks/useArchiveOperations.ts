import { useCallback } from 'react';
import { useFilesDispatch, useFilesState } from '../context/FilesContext';
import { useFileOperations } from './useFileOperations';
import { useFileNavigation } from './useFileNavigation';
import axiosInstance from '../../../utils/auth';
import { apiError, isExtractable } from '../utils/fileUtils';

export function useArchiveOperations() {
    const { selectedFiles, currentSession } = useFilesState();
    const dispatch = useFilesDispatch();
    const { fetchFiles } = useFileOperations();
    const { handleDirectoryChange } = useFileNavigation();

    const sessionId = currentSession?.id;

    const setLoading = useCallback((value: boolean) => {
        dispatch({ type: 'SET_LOADING', payload: { key: 'archiving', value } });
    }, [dispatch]);

    const notify = useCallback((message: string, type: 'error' | 'success' = 'error') => {
        dispatch({ type: 'SET_NOTICE', payload: { message, type } });
    }, [dispatch]);

    const handleMassArchive = useCallback(async (files = selectedFiles) => {
        const targets = Array.isArray(files) ? files : [files];
        if (!targets.length || !sessionId) return false;

        setLoading(true);
        try {
            const response = await axiosInstance.post('/api/files/archive', {
                sessionId,
                files: targets.map(file => ({ path: file.path, name: file.name }))
            });

            await fetchFiles();
            dispatch({ type: 'SET_SELECTED_FILES', payload: [] });
            notify(`Created ${response.data.data.archiveName}`, 'success');
            return true;
        } catch (error) {
            notify(apiError(error, 'Failed to create archive'));
            return false;
        } finally {
            setLoading(false);
        }
    }, [sessionId, selectedFiles, fetchFiles, dispatch, setLoading, notify]);

    const handleArchive = useCallback(
        (file) => handleMassArchive([file]),
        [handleMassArchive]
    );

    const handleUnarchive = useCallback(async (file) => {
        if (!file || !sessionId) return false;

        if (file.type === 'd' || !isExtractable(file.name)) {
            notify(`${file.name} is not an archive this panel can extract`);
            return false;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.post('/api/files/unarchive', {
                sessionId,
                archivePath: file.path
            });

            const { destination, destinationName } = response.data.data;
            notify(`Extracted into ${destinationName}`, 'success');
            handleDirectoryChange(destination);
            return true;
        } catch (error) {
            notify(apiError(error, 'Failed to extract archive'));
            return false;
        } finally {
            setLoading(false);
        }
    }, [sessionId, handleDirectoryChange, setLoading, notify]);

    return {
        handleArchive,
        handleUnarchive,
        handleMassArchive
    };
}
