import React from 'react';
import CreateNewButton from '../actions/CreateNewButton';
import UploadButton from '../actions/UploadButton';

const ActionButtons = () => {
    return (
        <div className="flex items-center gap-3 ml-4">
            <CreateNewButton />
            <UploadButton />
        </div>
    );
};

export default ActionButtons;