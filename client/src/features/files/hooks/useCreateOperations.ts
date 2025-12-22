import {useState, useCallback} from 'react';
import {useFilesState, useFilesDispatch} from '../context/FilesContext';
import {useFileOperations} from './useFileOperations';
import axiosInstance from '../../../utils/auth';

export function useCreateOperations() {
    const {currentDirectory, currentSession} = useFilesState();
    const dispatch = useFilesDispatch();
    const {fetchFiles} = useFileOperations();

    const sessionId = currentSession?.id;

    const [newFileName, setNewFileName] = useState('');
    const [newDirName, setNewDirName] = useState('');
    const [fileError, setFileError] = useState('');
    const [dirError, setDirError] = useState('');
    const [loading, setLocalLoading] = useState(false);

    const setLoading = useCallback((value: boolean) => {
        setLocalLoading(value);
        dispatch({
            type: 'SET_LOADING',
            payload: {key: 'creating', value}
        });
    }, [dispatch]);

    const handleCreateFile = useCallback(async () => {
        if (!newFileName.trim()) {
            setFileError('Please enter a file name');
            return;
        }

        if (!sessionId) {
            setFileError('No active session');
            return;
        }

        const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
        if (invalidChars.test(newFileName)) {
            setFileError('File name contains invalid characters');
            return;
        }

        setFileError('');
        setLoading(true);

        try {
            const filePath = `${currentDirectory}/${newFileName}`.replace(/\/+/g, '/');
            await axiosInstance.post('/api/files/create', {
                sessionId,
                path: filePath,
                content: ''
            });

            setNewFileName('');
            await fetchFiles();
        } catch (error) {
            console.error('error creating file:', error);
            setFileError(error.response?.data?.message || 'Failed to create file');
        } finally {
            setLoading(false);
        }
    }, [sessionId, currentDirectory, newFileName, fetchFiles, setLoading]);

    const handleCreateDir = useCallback(async () => {
        if (!newDirName.trim()) {
            setDirError('Please enter a directory name');
            return;
        }

        if (!sessionId) {
            setDirError('No active session');
            return;
        }

        const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
        if (invalidChars.test(newDirName)) {
            setDirError('Directory name contains invalid characters');
            return;
        }

        setDirError('');
        setLoading(true);

        try {
            const dirPath = `${currentDirectory}/${newDirName}`.replace(/\/+/g, '/');
            await axiosInstance.post('/api/files/create-directory', {
                sessionId,
                path: dirPath
            });

            setNewDirName('');
            await fetchFiles();
        } catch (error) {
            console.error('error creating directory:', error);
            setDirError(error.response?.data?.message || 'Failed to create directory');
        } finally {
            setLoading(false);
        }
    }, [sessionId, currentDirectory, newDirName, fetchFiles, setLoading]);

    return {
        newFileName,
        newDirName,
        loading,
        fileError,
        dirError,
        setNewFileName,
        setNewDirName,
        handleCreateFile,
        handleCreateDir
    };
}