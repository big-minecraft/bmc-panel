import { createContext, useContext, useReducer, ReactNode } from 'react';
import { FileEditSession, FileMetadata } from '../types/fileTypes';

interface FilesState {
    // Session state
    currentSession: FileEditSession | null;
    sessionLoading: boolean;
    sessionError: string | null;

    // File browser state
    files: FileMetadata[];
    selectedFiles: FileMetadata[];
    currentDirectory: string;
    currentDirectoryDeploymentType: any;

    // Loading states
    loading: {
        files: boolean;
        creating: boolean;
        deleting: boolean;
        moving: boolean;
        downloading: boolean;
        archiving: boolean;
        renaming: boolean;
        saving: boolean;
    };

    // Upload state
    uploadState: {
        uploading: boolean;
        progress: number;
        error: string | null;
    };

    // Modal states
    modals: {
        delete: { isOpen: boolean; files: string[] };
        move: { isOpen: boolean };
        rename: { isOpen: boolean; file: FileMetadata | null };
        editor: { isOpen: boolean; file: FileMetadata | null; content: string };
    };
}

type FilesAction =
    | { type: 'SET_SESSION'; payload: FileEditSession | null }
    | { type: 'SET_SESSION_LOADING'; payload: boolean }
    | { type: 'SET_SESSION_ERROR'; payload: string | null }
    | { type: 'SET_FILES'; payload: FileMetadata[] }
    | { type: 'SET_SELECTED_FILES'; payload: FileMetadata[] }
    | { type: 'SET_CURRENT_DIRECTORY'; payload: string }
    | { type: 'SET_CURRENT_DIRECTORY_DEPLOYMENT_TYPE'; payload: any }
    | { type: 'SET_LOADING'; payload: { key: string; value: boolean } }
    | { type: 'SET_UPLOAD_STATE'; payload: Partial<FilesState['uploadState']> }
    | { type: 'SET_MODAL_STATE'; payload: { modal: string; state: any } };

const FilesContext = createContext<FilesState | null>(null);
const FilesDispatchContext = createContext<React.Dispatch<FilesAction> | null>(null);

const initialState: FilesState = {
    currentSession: null,
    sessionLoading: false,
    sessionError: null,
    files: [],
    selectedFiles: [],
    currentDirectory: '',
    currentDirectoryDeploymentType: null,
    loading: {
        files: false,
        creating: false,
        deleting: false,
        moving: false,
        downloading: false,
        archiving: false,
        renaming: false,
        saving: false
    },
    uploadState: {
        uploading: false,
        progress: 0,
        error: null
    },
    modals: {
        delete: { isOpen: false, files: [] },
        move: { isOpen: false },
        rename: { isOpen: false, file: null },
        editor: { isOpen: false, file: null, content: '' }
    }
};

function filesReducer(state: FilesState, action: FilesAction): FilesState {
    switch (action.type) {
        case 'SET_SESSION':
            return { ...state, currentSession: action.payload };
        case 'SET_SESSION_LOADING':
            return { ...state, sessionLoading: action.payload };
        case 'SET_SESSION_ERROR':
            return { ...state, sessionError: action.payload };
        case 'SET_FILES':
            return { ...state, files: action.payload };
        case 'SET_SELECTED_FILES':
            return { ...state, selectedFiles: action.payload };
        case 'SET_CURRENT_DIRECTORY':
            return { ...state, currentDirectory: action.payload };
        case 'SET_CURRENT_DIRECTORY_DEPLOYMENT_TYPE':
            return { ...state, currentDirectoryDeploymentType: action.payload };
        case 'SET_LOADING':
            return {
                ...state,
                loading: { ...state.loading, [action.payload.key]: action.payload.value }
            };
        case 'SET_UPLOAD_STATE':
            return {
                ...state,
                uploadState: { ...state.uploadState, ...action.payload }
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

export function FilesProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(filesReducer, initialState);

    return (
        <FilesContext.Provider value={state}>
            <FilesDispatchContext.Provider value={dispatch}>
                {children}
            </FilesDispatchContext.Provider>
        </FilesContext.Provider>
    );
}

export function useFilesState() {
    const context = useContext(FilesContext);
    if (context === null) {
        throw new Error('useFilesState must be used within a FilesProvider');
    }
    return context;
}

export function useFilesDispatch() {
    const context = useContext(FilesDispatchContext);
    if (context === null) {
        throw new Error('useFilesDispatch must be used within a FilesProvider');
    }
    return context;
}
