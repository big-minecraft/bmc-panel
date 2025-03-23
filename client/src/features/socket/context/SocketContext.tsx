import React, { createContext, useContext, useEffect, useState } from 'react';
import ClientSocket from '../controllers/client-socket';
import SocketService from "../controllers/socket-service.ts";

interface SocketContextType {
    socket: ClientSocket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [isPageLoaded, setIsPageLoaded] = useState(false);

    useEffect(() => {
        if (document.readyState === 'complete') {
            setIsPageLoaded(true);
        } else {
            window.addEventListener('load', () => setIsPageLoaded(true));
            return () => window.removeEventListener('load', () => setIsPageLoaded(true));
        }
    }, []);

    useEffect(() => {
        if (isPageLoaded) {
            SocketService.init();
            return () => {
                SocketService.disconnect();
            };
        }
    }, [isPageLoaded]);

    return (
        <SocketContext.Provider value={{ socket: SocketService.getSocket() }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context.socket;
};