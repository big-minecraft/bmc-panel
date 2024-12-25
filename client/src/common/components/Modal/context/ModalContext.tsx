import React, {createContext, useContext, useReducer, useCallback} from 'react';
import {ModalContextValue} from '../types';

type ModalState = {
    openModals: string[];
};

type ModalAction =
    | { type: 'REGISTER_MODAL'; payload: string }
    | { type: 'UNREGISTER_MODAL'; payload: string }
    | { type: 'CLOSE_MODAL'; payload: string }
    | { type: 'CLOSE_ALL_MODALS' };

const ModalContext = createContext<ModalContextValue | null>(null);

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
    switch (action.type) {
        case 'REGISTER_MODAL':
            if (state.openModals.includes(action.payload)) {
                return state;
            }
            return {
                ...state,
                openModals: [...state.openModals, action.payload]
            };

        case 'UNREGISTER_MODAL':
            return {
                ...state,
                openModals: state.openModals.filter(id => id !== action.payload)
            };

        case 'CLOSE_MODAL':
            return {
                ...state,
                openModals: state.openModals.filter(id => id !== action.payload)
            };

        case 'CLOSE_ALL_MODALS':
            return {
                ...state,
                openModals: []
            };

        default:
            return state;
    }
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [state, dispatch] = useReducer(modalReducer, {
        openModals: []
    });

    const registerModal = useCallback((id: string) => {
        dispatch({type: 'REGISTER_MODAL', payload: id});
    }, []);

    const unregisterModal = useCallback((id: string) => {
        dispatch({type: 'UNREGISTER_MODAL', payload: id});
    }, []);

    const closeModal = useCallback((id: string) => {
        dispatch({type: 'CLOSE_MODAL', payload: id});
    }, []);

    const closeAllModals = useCallback(() => {
        dispatch({type: 'CLOSE_ALL_MODALS'});
    }, []);

    const value: ModalContextValue = {
        openModals: state.openModals,
        registerModal,
        unregisterModal,
        closeModal,
        closeAllModals
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModalContext = (): ModalContextValue => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModalContext must be used within a ModalProvider');
    }
    return context;
};