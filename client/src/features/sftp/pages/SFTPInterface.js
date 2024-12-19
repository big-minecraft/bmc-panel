import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SFTPProvider } from '../context/SFTPContext.js';
import { useFileOperations } from '../hooks/useFileOperations.js';
import { useFileNavigation } from '../hooks/useFileNavigation.js';
import Toolbar from '../components/navigation/Toolbar.js';
import FilesList from '../components/files/FilesList.js';
import ModalsContainer from '../components/modals/ModalsContainer.js';
import UploadOverlay from "../components/misc/UploadOverlay.js";
import ActionOverlay from "../components/actions/ActionOverlay.js";

function SFTPContent() {
    const location = useLocation();
    const { fetchFiles } = useFileOperations();
    const { currentDirectory, handleDirectoryChange, getInitialDirectory } = useFileNavigation();

    useEffect(() => {
        const newDirectory = getInitialDirectory(location);
        if (newDirectory !== currentDirectory) {
            handleDirectoryChange(newDirectory);
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchFiles();
    }, [currentDirectory, fetchFiles]);

    return (
        <div className="container-fluid py-4">
            <UploadOverlay />
            <Toolbar />
            <FilesList />
            <ActionOverlay />
            <ModalsContainer />
        </div>
    );
}

const SFTPInterface = () => (
    <SFTPProvider>
        <SFTPContent />
    </SFTPProvider>
);

export default SFTPInterface;