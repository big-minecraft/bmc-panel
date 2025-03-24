import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface GlobalState {
    areFilesSynced: boolean;
}

type GlobalAction =
    | { type: 'SET_FILES_SYNCED', payload: boolean }

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);
const GlobalDispatchContext = createContext<React.Dispatch<GlobalAction> | undefined>(undefined);

const initialState: GlobalState = {
    areFilesSynced: true,
};

const globalReducer = (state: GlobalState, action: GlobalAction): GlobalState => {
    switch (action.type) {
        case 'SET_FILES_SYNCED':
            return { ...state, areFilesSynced: action.payload };
        default:
            return state;
    }
};

interface GlobalProviderProps {
    children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(globalReducer, initialState);

    return (
        <GlobalStateContext.Provider value={state}>
            <GlobalDispatchContext.Provider value={dispatch}>
                {children}
            </GlobalDispatchContext.Provider>
        </GlobalStateContext.Provider>
    );
};

export function useGlobalState() {
    const context = useContext(GlobalStateContext);
    if (context === undefined) {
        throw new Error('useGlobalState must be used within a GlobalProvider');
    }
    return context;
}

export function useGlobalDispatch() {
    const context = useContext(GlobalDispatchContext);
    if (context === undefined) {
        throw new Error('useGlobalDispatch must be used within a GlobalProvider');
    }
    return context;
}