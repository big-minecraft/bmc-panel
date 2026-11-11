import {useCallback, useEffect, useState} from 'react';

type NotificationType = 'success' | 'danger' | 'warning' | 'info';

interface Notification {
    id: number;
    message: string;
    type: NotificationType;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (notifications.length > 0) {
            const timer = setTimeout(() => {
                setNotifications(prev => prev.slice(1));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notifications]);

    const addNotification = useCallback((message: string, type: NotificationType) => {
        setNotifications(prev => [...prev, {id: Date.now(), message, type}]);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return {notifications, addNotification, removeNotification};
};
