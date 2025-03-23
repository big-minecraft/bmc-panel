import {createContext, useContext, useReducer} from 'react';

const SFTPContext = createContext(null);
const SFTPDispatchContext = createContext(null);

const initialState = {
    files: [],
    selectedFiles: [],
    currentDirectory: '',
    fileSyncInProgress: false,
    loading: {
        files: false,
        creating: false,
        deleting: false,
        moving: false,
        downloading: false,
        archiving: false,
        renaming: false
    },
    uploadState: {
        uploading: false,
        progress: 0,
        error: null
    },
    modals: {
        delete: {isOpen: false, files: []},
        move: {isOpen: false},
        rename: {isOpen: false, file: null},
        editor: {isOpen: false, file: null, content: ''}
    }
};

function sftpReducer(state, action) {
    switch (action.type) {
        case 'SET_FILES':
            return {...state, files: action.payload};
        case 'SET_SELECTED_FILES':
            return {...state, selectedFiles: action.payload};
        case 'SET_CURRENT_DIRECTORY':
            return {...state, currentDirectory: action.payload};
        case 'SET_FILE_SYNC_IN_PROGRESS':
            return {...state, fileSyncInProgress: action.payload};
        case 'SET_LOADING':
            return {
                ...state,
                loading: {...state.loading, [action.payload.key]: action.payload.value}
            };
        case 'SET_UPLOAD_STATE':
            return {
                ...state,
                uploadState: {...state.uploadState, ...action.payload}
            };
        case 'SET_MODAL_STATE':
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.payload.modal]: action.payload.state
                }
            };
        default:
            return state;
    }
}

export function SFTPProvider({children}) {
    const [state, dispatch] = useReducer(sftpReducer, initialState);

    return (
        <SFTPContext.Provider value={state}>
            <SFTPDispatchContext.Provider value={dispatch}>
                {children}
            </SFTPDispatchContext.Provider>
        </SFTPContext.Provider>
    );
}

export function useSFTPState() {
    const context = useContext(SFTPContext);
    if (context === undefined) {
        throw new Error('useSFTPState must be used within a SFTPProvider');
    }
    return context;
}

export function useSFTPDispatch() {
    const context = useContext(SFTPDispatchContext);
    if (context === undefined) {
        throw new Error('useSFTPDispatch must be used within a SFTPProvider');
    }
    return context;
}