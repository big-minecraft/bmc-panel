import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import ClientSocket from '../controllers/client-socket';
import SocketService from "../controllers/socket-service";
import { SocketMessageType } from "../../../../../shared/enum/enums/socket-message-type";
import SocketListener from "../../../../../shared/model/socket-listener.ts";

interface SocketContextType {
    socket: ClientSocket | null;
    addListener: <T>(listener: SocketListener<T>) => void;
    removeListener: <T>(listener: SocketListener<T>) => void;
    sendMessage: <T>(messageType: SocketMessageType, data: T) => boolean;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<ClientSocket | null>(null);

    useEffect(() => {
        const initSocket = () => {
            console.log('initializing socket from react context')
            SocketService.init();
            const socketInstance = SocketService.getSocket();
            setSocket(socketInstance);

            if (socketInstance) {
                const handleConnect = () => setIsConnected(true);
                const handleDisconnect = () => setIsConnected(false);
                socketInstance.onConnect(handleConnect);
                socketInstance.onDisconnect(handleDisconnect);
                setIsConnected(socketInstance.isConnected());
            }
        };

        if (document.readyState === 'complete') {
            initSocket();
        } else {
            const handleLoad = () => initSocket();
            window.addEventListener('load', handleLoad);
            return () => window.removeEventListener('load', handleLoad);
        }

        return () => {
            SocketService.disconnect();
        };
    }, []);

    const addListener = useCallback(<T,>(listener: SocketListener<T>) => {
        if (socket) {
            socket.registerCustomListener(listener);
        }
    }, [socket]);

    const removeListener = useCallback(<T,>(listener: SocketListener<T>) => {
        if (socket) {
            socket.unregisterCustomListener(listener);
        }
    }, [socket]);

    const sendMessage = useCallback(<T,>(messageType: SocketMessageType, data: T): boolean => {
        if (socket) {
            return socket.sendMessage(messageType, data);
        }
        return false;
    }, [socket]);

    const value = {
        socket,
        addListener,
        removeListener,
        sendMessage,
        isConnected
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};