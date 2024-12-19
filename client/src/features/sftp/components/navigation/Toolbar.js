import React from 'react';
import Breadcrumb from './Breadcrumb.js';
import ActionButtons from './ActionButtons.js';

const Toolbar = () => {
    return (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
            <Breadcrumb />
            <ActionButtons />
        </div>
    );
};

export default Toolbar;