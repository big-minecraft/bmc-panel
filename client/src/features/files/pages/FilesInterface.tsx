import { useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { FilesProvider, useFilesState, useFilesDispatch } from '../context/FilesContext';
import { useFileOperations } from '../hooks/useFileOperations';
import { useFileNavigation } from '../hooks/useFileNavigation';
import { useFileSessions } from '../hooks/useFileSessions';
import Toolbar from '../components/navigation/Toolbar';
import FilesList from '../components/files/FilesList';
import ModalsContainer from '../components/modals/ModalsContainer';
import UploadOverlay from "../components/misc/UploadOverlay";
import Notice from "../components/misc/Notice";
import ActionOverlay from "../components/actions/ActionOverlay";

function FilesContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const { deploymentName } = useParams<{ deploymentName: string }>();
    const { fetchFiles } = useFileOperations();
    const { currentDirectory, handleDirectoryChange, getInitialDirectory } = useFileNavigation();
    const { currentSession, sessionLoading } = useFilesState();
    const dispatch = useFilesDispatch();
    const { refreshSession, getSessionStatus, listSessionsByDeployment } = useFileSessions();

    useEffect(() => {
        const loadSession = async () => {
            if (currentSession) return;

            try {
                dispatch({ type: 'SET_SESSION_LOADING', payload: true });

                if (location.state?.sessionId) {
                    const session = await getSessionStatus(location.state.sessionId);
                    dispatch({ type: 'SET_SESSION', payload: session });
                } else if (deploymentName) {
                    const sessions = await listSessionsByDeployment(deploymentName);
                    if (sessions.length > 0) {
                        dispatch({ type: 'SET_SESSION', payload: sessions[0] });
                    } else navigate(`/files/session/${deploymentName}`, { replace: true });
                }
            } catch (error) {
                console.error('Failed to load session:', error);
                if (deploymentName) navigate(`/files/session/${deploymentName}`, { replace: true });
            } finally {
                dispatch({ type: 'SET_SESSION_LOADING', payload: false });
            }
        };
        loadSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!currentSession?.id) return;

        const interval = setInterval(async () => {
            try {
                await refreshSession(currentSession.id);
            } catch (error) {
                console.error('Failed to refresh session:', error);
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [currentSession?.id, refreshSession]);

    useEffect(() => {
        const newDirectory = getInitialDirectory(location);
        if (newDirectory !== currentDirectory) handleDirectoryChange(newDirectory);
    }, [location.pathname]);

    useEffect(() => {
        if (!currentDirectory || !currentSession) return;
        fetchFiles();
    }, [currentDirectory, currentSession, fetchFiles]);

    if (sessionLoading || !currentSession) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-gray-600">Loading session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <Notice />
            <UploadOverlay />
            <Toolbar />
            <FilesList />
            <ActionOverlay />
            <ModalsContainer />
        </div>
    );
}

const FilesInterface = () => (
    <FilesProvider>
        <FilesContent />
    </FilesProvider>
);

export default FilesInterface;
