import {useCallback} from 'react';
import {useSFTPState, useSFTPDispatch} from '../context/SFTPContext';

export function useFileSelection() {
    const {selectedFiles, files} = useSFTPState();
    const dispatch = useSFTPDispatch();

    const handleSelectFile = useCallback((file) => {
        dispatch({
            type: 'SET_SELECTED_FILES',
            payload: selectedFiles.some(f => f.path === file.path)
                ? selectedFiles.filter(f => f.path !== file.path)
                : [...selectedFiles, file]
        });
    }, [selectedFiles, dispatch]);

    const handleSelectAllFiles = useCallback((selected) => {
        dispatch({
            type: 'SET_SELECTED_FILES',
            payload: selected ? [...files] : []
        });
    }, [files, dispatch]);

    const clearSelection = useCallback(() => {
        dispatch({type: 'SET_SELECTED_FILES', payload: []});
    }, [dispatch]);

    return {
        selectedFiles,
        handleSelectFile,
        handleSelectAllFiles,
        clearSelection
    };
}