import { useState, useCallback } from 'react';
import { useSFTPState, useSFTPDispatch } from '../context/SFTPContext';
import { useFileOperations } from './useFileOperations';
import axiosInstance from '../../../utils/auth';

export function useCreateOperations() {
    const { currentDirectory } = useSFTPState();
    const dispatch = useSFTPDispatch();
    const { fetchFiles } = useFileOperations();

    const [newFileName, setNewFileName] = useState('');
    const [newDirName, setNewDirName] = useState('');
    const [fileError, setFileError] = useState('');
    const [dirError, setDirError] = useState('');

    const setLoading = useCallback((value) => {
        dispatch({
            type: 'SET_LOADING',
            payload: { key: 'creating', value }
        });
    }, [dispatch]);

    const handleCreateFile = useCallback(async () => {
        if (!newFileName.trim()) {
            setFileError('Please enter a file name');
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
            await axiosInstance.post('/api/sftp/file', {
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
    }, [currentDirectory, newFileName, fetchFiles, setLoading]);

    const handleCreateDir = useCallback(async () => {
        if (!newDirName.trim()) {
            setDirError('Please enter a directory name');
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
            await axiosInstance.post('/api/sftp/directories', {
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
    }, [currentDirectory, newDirName, fetchFiles, setLoading]);

    return {
        newFileName,
        newDirName,
        fileError,
        dirError,
        setNewFileName,
        setNewDirName,
        handleCreateFile,
        handleCreateDir
    };
}