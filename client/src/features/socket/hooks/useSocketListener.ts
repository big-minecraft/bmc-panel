import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import SocketListener from '../../../../../shared/model/socket-listener';
import { SocketMessageType } from '../../../../../shared/enum/enums/socket-message-type';

/**
 * Custom hook for managing socket listeners in React components
 *
 * @param messageType The socket message type to listen for
 * @param callback Function to be called when message is received
 * @param validator Optional validation function
 */
export function useSocketListener<T>(
    messageType: SocketMessageType,
    callback: (data: T) => void,
    validator?: (data: unknown) => boolean
): void {
    const { addListener, removeListener } = useSocket();
    const callbackRef = useRef(callback);
    const validatorRef = useRef(validator);

    useEffect(() => {
        callbackRef.current = callback;
        validatorRef.current = validator;
    }, [callback, validator]);

    const getListener = useCallback(() => {
        return new class extends SocketListener<T> {
            constructor() {
                super(messageType);
            }

            validateMessage(message: unknown): boolean {
                if (validatorRef.current) return validatorRef.current(message);
                return true;
            }

            onMessage(data: T): void {
                callbackRef.current(data);
            }
        }();
    }, [messageType]);

    useEffect(() => {
        const listener = getListener();

        addListener(listener);

        return () => {
            removeListener(listener);
        };
    }, [addListener, removeListener, getListener]);
}