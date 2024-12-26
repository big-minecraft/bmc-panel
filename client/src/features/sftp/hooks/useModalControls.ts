import {useCallback} from 'react';
import {useSFTPDispatch} from '../context/SFTPContext';

export function useModalControls() {
    const dispatch = useSFTPDispatch();

    const openDeleteModal = useCallback((files) => {
        const filesToDelete = Array.isArray(files) ? files : [files];
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'delete',
                state: {isOpen: true, files: filesToDelete}
            }
        });
    }, [dispatch]);

    const openMoveModal = useCallback(() => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'move',
                state: {isOpen: true}
            }
        });
    }, [dispatch]);

    const openRenameModal = useCallback((file) => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'rename',
                state: {isOpen: true, file}
            }
        });
    }, [dispatch]);

    const openEditorModal = useCallback(async (file, content) => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'editor',
                state: {isOpen: true, file, content}
            }
        });
    }, [dispatch]);

    const closeModal = useCallback((modalName) => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: modalName,
                state: {isOpen: false}
            }
        });
    }, [dispatch]);

    return {
        openDeleteModal,
        openMoveModal,
        openRenameModal,
        openEditorModal,
        closeModal
    };
}