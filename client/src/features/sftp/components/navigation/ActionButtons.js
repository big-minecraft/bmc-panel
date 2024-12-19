import React from 'react';
import CreateNewButton from '../actions/CreateNewButton.js';
import UploadButton from '../actions/UploadButton.js';

const ActionButtons = () => {
    return (
        <div className="flex items-center gap-3 ml-4">
            <CreateNewButton />
            <UploadButton />
        </div>
    );
};

export default ActionButtons;