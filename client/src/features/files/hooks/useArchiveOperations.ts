import {useCallback} from 'react';
import {useFilesState, useFilesDispatch} from '../context/FilesContext';
import {useFileOperations} from './useFileOperations';
import axiosInstance from '../../../utils/auth';

export function useArchiveOperations() {
    const {selectedFiles, currentSession} = useFilesState();
    const dispatch = useFilesDispatch();
    const {fetchFiles} = useFileOperations();

    const sessionId = currentSession?.id;

    const setLoading = useCallback((value) => {
        dispatch({
            type: 'SET_LOADING',
            payload: {key: 'archiving', value}
        });
    }, [dispatch]);

    const handleArchive = useCallback(async (file) => {
        if (!file || !sessionId) return;

        setLoading(true);

        try {
            const archivePath = `${file.path}.tar.gz`;
            await axiosInstance.post('/api/files/archive', {
                sessionId,
                path: file.path,
                archivePath
            });
            await fetchFiles();
        } catch (error) {
            console.error('error archiving file:', error);
        } finally {
            setLoading(false);
        }
    }, [sessionId, fetchFiles, setLoading]);

    const handleUnarchive = useCallback(async (file) => {
        if (!file || file.type === 'd' || !file.isArchived || !sessionId) return;

        setLoading(true);

        try {
            const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
            await axiosInstance.post('/api/files/unarchive', {
                sessionId,
                archivePath: file.path,
                destinationPath: parentDir
            });
            await fetchFiles();
        } catch (error) {
            console.error('error unarchiving file:', error);
        } finally {
            setLoading(false);
        }
    }, [sessionId, fetchFiles, setLoading]);

    const handleMassArchive = useCallback(async (filesToArchive = selectedFiles) => {
        if (!filesToArchive?.length || !sessionId) return;

        setLoading(true);
        try {
            if (filesToArchive.length === 1) {
                // Single file - use the single file archive endpoint
                const file = filesToArchive[0];
                const archivePath = `${file.path}.tar.gz`;
                await axiosInstance.post('/api/files/archive', {
                    sessionId,
                    path: file.path,
                    archivePath
                });
            } else {
                // Multiple files - use the archive-multiple endpoint to create a single archive
                await axiosInstance.post('/api/files/archive-multiple', {
                    sessionId,
                    files: filesToArchive.map(f => ({
                        path: f.path,
                        name: f.name
                    }))
                });
            }
            await fetchFiles();
            dispatch({type: 'SET_SELECTED_FILES', payload: []});
        } catch (error) {
            console.error('error archiving files:', error);
        } finally {
            setLoading(false);
        }
    }, [sessionId, selectedFiles, fetchFiles, dispatch, setLoading]);

    return {
        handleArchive,
        handleUnarchive,
        handleMassArchive
    };
}