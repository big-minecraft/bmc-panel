import CreateNewButton from '../actions/CreateNewButton';
import UploadButton from '../actions/UploadButton';
import SyncStatus from '../actions/SyncStatus';
import React from "react";

const ActionButtons = () => {
    return (
        <div className="flex items-center gap-3 ml-4">
            <SyncStatus />
            <UploadButton />
            <CreateNewButton />
        </div>
    );
};

export default ActionButtons;