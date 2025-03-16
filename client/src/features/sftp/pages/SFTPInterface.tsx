import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {SFTPProvider} from '../context/SFTPContext';
import {useFileOperations} from '../hooks/useFileOperations';
import {useFileNavigation} from '../hooks/useFileNavigation';
import Toolbar from '../components/navigation/Toolbar';
import FilesList from '../components/files/FilesList';
import ModalsContainer from '../components/modals/ModalsContainer';
import UploadOverlay from "../components/misc/UploadOverlay";
import ActionOverlay from "../components/actions/ActionOverlay";
import {DeployButtonProvider} from "../context/DeployButtonContext.tsx";

function SFTPContent() {
    const location = useLocation();
    const {fetchFiles} = useFileOperations();
    const {currentDirectory, handleDirectoryChange, getInitialDirectory} = useFileNavigation();

    useEffect(() => {
        const newDirectory = getInitialDirectory(location);
        if (newDirectory !== currentDirectory) {
            handleDirectoryChange(newDirectory);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!currentDirectory) return;
        fetchFiles();
    }, [currentDirectory, fetchFiles]);

    return (
        <div className="container-fluid py-4">
            <UploadOverlay/>
            <Toolbar/>
            <FilesList/>
            <ActionOverlay/>
            <ModalsContainer/>
        </div>
    );
}

const SFTPInterface = () => (
    <SFTPProvider>
        <DeployButtonProvider>
            <SFTPContent/>
        </DeployButtonProvider>
    </SFTPProvider>
);

export default SFTPInterface;