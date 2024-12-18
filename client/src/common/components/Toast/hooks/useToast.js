import { useState, useCallback, useRef } from 'react';

export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

export const useToast = (timeout = 5000) => {
    const [toasts, setToasts] = useState([]);
    const toastIdCounter = useRef(0);

    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback(({ type, title, message }) => {
        const id = toastIdCounter.current++;

        setToasts(prevToasts => [
            ...prevToasts,
            {
                id,
                type,
                title,
                message,
                timestamp: Date.now()
            }
        ]);

        if (timeout) {
            setTimeout(() => removeToast(id), timeout);
        }

        return id;
    }, [timeout, removeToast]);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const success = useCallback((message, title) =>
        addToast({ type: TOAST_TYPES.SUCCESS, title, message }), [addToast]);

    const error = useCallback((message, title) =>
        addToast({ type: TOAST_TYPES.ERROR, title, message }), [addToast]);

    const warning = useCallback((message, title) =>
        addToast({ type: TOAST_TYPES.WARNING, title, message }), [addToast]);

    const info = useCallback((message, title) =>
        addToast({ type: TOAST_TYPES.INFO, title, message }), [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info
    };
};