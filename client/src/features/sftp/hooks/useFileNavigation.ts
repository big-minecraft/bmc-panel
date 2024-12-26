import {useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {useSFTPState, useSFTPDispatch} from '../context/SFTPContext';

export function useFileNavigation() {
    const {currentDirectory} = useSFTPState();
    const dispatch = useSFTPDispatch();
    const navigate = useNavigate();

    const getInitialDirectory = useCallback((location) => {
        const urlPath = location.pathname.replace('/files', '') || '/';
        const decodedPath = decodeURIComponent(urlPath);

        if (!decodedPath || decodedPath === '/') {
            return '/nfsshare';
        }

        return `/nfsshare${decodedPath.startsWith('/') ? decodedPath : '/' + decodedPath}`;
    }, []);

    const handleDirectoryChange = useCallback((newPath) => {
        const normalizedPath = newPath.startsWith('/nfsshare')
            ? newPath
            : `/nfsshare${newPath.startsWith('/') ? newPath : '/' + newPath}`;

        const urlPath = normalizedPath.replace('/nfsshare', '');
        // Encode the URL path while preserving forward slashes
        const encodedPath = encodeURIComponent(urlPath).replace(/%2F/g, '/');

        navigate(`/files${encodedPath}`);
        dispatch({type: 'SET_CURRENT_DIRECTORY', payload: normalizedPath});
    }, [dispatch, navigate]);

    return {
        currentDirectory,
        getInitialDirectory,
        handleDirectoryChange
    };
}