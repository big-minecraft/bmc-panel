import CreateNewButton from '../actions/CreateNewButton';
import UploadButton from '../actions/UploadButton';
import React from "react";

const ActionButtons = () => {

    return (
        <div className="flex items-center gap-3 ml-4">
            <UploadButton />
            <CreateNewButton />
        </div>
    );
};

export default ActionButtons;