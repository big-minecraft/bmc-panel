import {useState, useCallback, useRef} from 'react';
import {Toast, ToastType, ToastContextValue, UseToastOptions} from '../types';

export const useToast = (timeout: number = 5000): ToastContextValue => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastIdCounter = useRef(0);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback(({type, title, message}: Omit<Toast, 'id' | 'timestamp'>): number => {
        const id = toastIdCounter.current++;

        const newToast: Toast = {
            id,
            type,
            title,
            message,
            timestamp: Date.now()
        };

        setToasts(prevToasts => [...prevToasts, newToast]);

        if (timeout) {
            setTimeout(() => removeToast(id), timeout);
        }

        return id;
    }, [timeout, removeToast]);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const createToastMethod = useCallback((type: ToastType) => {
        return (message: string, title?: string) =>
            addToast({type, title, message});
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success: createToastMethod('success'),
        error: createToastMethod('error'),
        warning: createToastMethod('warning'),
        info: createToastMethod('info')
    };
};