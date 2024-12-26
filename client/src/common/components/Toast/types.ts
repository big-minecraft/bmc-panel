import {ReactNode} from 'react';
import {HTMLMotionProps} from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    type: ToastType;
    title?: string;
    message: string;
    timestamp: number;
}

export interface ToastConfig {
    icon: React.FC<any>;
    className: string;
    iconClass: string;
}

export interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => number;
    removeToast: (id: number) => void;
    clearToasts: () => void;
    success: (message: string, title?: string) => number;
    error: (message: string, title?: string) => number;
    warning: (message: string, title?: string) => number;
    info: (message: string, title?: string) => number;
}

export interface ToastMessageProps extends HTMLMotionProps<"div"> {
    toast: Toast;
    onDismiss: (id: number) => void;
}

export interface ToastContainerProps extends HTMLMotionProps<"div"> {
    toasts: Toast[];
    onDismiss: (id: number) => void;
}

export interface UseToastOptions {
    timeout?: number;
}