import React, { createContext, useContext } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContextValue } from '../types';
import ToastContainer from '../index';

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const toast = useToast();

    return (
        <ToastContext.Provider value={toast}>
            <ToastContainer toasts={toast.toasts} onDismiss={toast.removeToast} />
            {children}
        </ToastContext.Provider>
    );
};

export const useToastContext = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
};