import {useCallback} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useFilesState, useFilesDispatch} from '../context/FilesContext';

export function useFileNavigation() {
    const {currentDirectory} = useFilesState();
    const dispatch = useFilesDispatch();
    const navigate = useNavigate();
    const { deploymentName } = useParams<{ deploymentName: string }>();

    const getInitialDirectory = useCallback((location) => {
        // URL pattern is /files/:deploymentName
        const urlPath = location.pathname.replace(`/files/${deploymentName}`, '') || '/';
        const decodedPath = decodeURIComponent(urlPath);

        if (!decodedPath || decodedPath === '/') {
            return '/minecraft';
        }

        return `/minecraft${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;
    }, [deploymentName]);

    const handleDirectoryChange = useCallback((newPath) => {
        const normalizedPath = newPath.startsWith('/minecraft')
            ? newPath
            : `/minecraft${newPath.startsWith('/') ? newPath : '/' + newPath}`;

        const urlPath = normalizedPath.replace('/minecraft', '');
        // Encode the URL path while preserving forward slashes
        const encodedPath = encodeURIComponent(urlPath).replace(/%2F/g, '/');

        navigate(`/files/${deploymentName}${encodedPath}`);
        dispatch({type: 'SET_CURRENT_DIRECTORY', payload: normalizedPath});
    }, [deploymentName, dispatch, navigate]);

    return {
        currentDirectory,
        getInitialDirectory,
        handleDirectoryChange
    };
}