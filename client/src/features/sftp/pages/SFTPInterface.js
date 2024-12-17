import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SFTPProvider } from '../context/SFTPContext';
import { useFileOperations } from '../hooks/useFileOperations';
import { useFileNavigation } from '../hooks/useFileNavigation';
import Breadcrumb from '../components/navigation/Breadcrumb';
import FilesList from '../components/files/FilesList';
import ActionBar from '../components/actions/ActionBar';
import ModalsContainer from '../components/modals/ModalsContainer';
import UploadOverlay from "../components/misc/UploadOverlay";
import ActionOverlay from "../components/actions/ActionOverlay";

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
            <Breadcrumb />
            <ActionBar />
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