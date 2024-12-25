import React from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {CheckCircle, XCircle, AlertTriangle, Info, X} from 'lucide-react';
import {ToastMessageProps, ToastContainerProps, ToastType, ToastConfig} from './types';

const toastConfig: Record<ToastType, ToastConfig> = {
    success: {
        icon: CheckCircle,
        className: 'bg-green-50 text-green-800 border-green-100',
        iconClass: 'text-green-400'
    },
    error: {
        icon: XCircle,
        className: 'bg-red-50 text-red-800 border-red-100',
        iconClass: 'text-red-400'
    },
    warning: {
        icon: AlertTriangle,
        className: 'bg-yellow-50 text-yellow-800 border-yellow-100',
        iconClass: 'text-yellow-400'
    },
    info: {
        icon: Info,
        className: 'bg-blue-50 text-blue-800 border-blue-100',
        iconClass: 'text-blue-400'
    }
};

const ToastMessage: React.FC<ToastMessageProps> = ({toast, onDismiss}) => {
    const config = toastConfig[toast.type];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{opacity: 0, y: -20, scale: 0.95}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 20, scale: 0.95}}
            className={`
        pointer-events-auto w-full max-w-sm rounded-lg border
        shadow-lg ring-1 ring-black ring-opacity-5
        ${config.className}
      `}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <Icon className={`h-5 w-5 ${config.iconClass} mt-0.5`}/>
                    <div className="ml-3 w-0 flex-1">
                        {toast.title && (
                            <p className="text-sm font-medium">
                                {toast.title}
                            </p>
                        )}
                        <p className="mt-1 text-sm">
                            {toast.message}
                        </p>
                    </div>
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className={`
              ml-4 inline-flex rounded-md
              hover:bg-black hover:bg-opacity-10
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${config.iconClass.replace('text', 'focus:ring')}
            `}
                    >
                        <X className="h-5 w-5"/>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const ToastContainer: React.FC<ToastContainerProps> = ({toasts, onDismiss}) => {
    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-end gap-2 p-4 sm:p-6">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <ToastMessage
                        key={toast.id}
                        toast={toast}
                        onDismiss={onDismiss}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;