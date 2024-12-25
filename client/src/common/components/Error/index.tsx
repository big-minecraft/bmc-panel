import React from 'react';
import {motion} from 'framer-motion';
import {CheckCircle, XCircle, AlertCircle, Info, LucideIcon} from 'lucide-react';
import type {MessageAlertProps, MessageType} from './types';
import {alertStyles} from './types';

const icons: Record<MessageType, LucideIcon> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
};

const MessageAlert = React.forwardRef<HTMLDivElement, MessageAlertProps>(({
    message,
    type = 'info',
    className = '',
    ...props
}, ref) => {
    const styles = alertStyles[type];
    const Icon = icons[type];

    return (
        <motion.div
            ref={ref}
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            className={`rounded-lg ${styles.background} p-4 mt-4 ${className}`}
            {...props}
        >
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${styles.icon}`} aria-hidden="true"/>
                </div>
                <div className="ml-3">
                    <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
                </div>
            </div>
        </motion.div>
    );
});

MessageAlert.displayName = 'MessageAlert';

export default MessageAlert;