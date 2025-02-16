export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface MessageAlertProps {
    message: string;
    type?: MessageType;
    className?: string;
}

export const alertStyles: Record<MessageType, {
    background: string;
    text: string;
    icon: string;
}> = {
    success: {
        background: 'bg-green-50',
        text: 'text-green-800',
        icon: 'text-green-400'
    },
    error: {
        background: 'bg-red-50',
        text: 'text-red-800',
        icon: 'text-red-400'
    },
    info: {
        background: 'bg-blue-50',
        text: 'text-blue-800',
        icon: 'text-blue-400'
    },
    warning: {
        background: 'bg-yellow-50',
        text: 'text-yellow-800',
        icon: 'text-yellow-400'
    }
};