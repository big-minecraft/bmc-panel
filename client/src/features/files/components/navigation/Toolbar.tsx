import Breadcrumb from './Breadcrumb';
import ActionButtons from './ActionButtons';
import React from "react";

const Toolbar = () => {
    return (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
            <Breadcrumb/>
            <ActionButtons/>
        </div>
    );
};

export default Toolbar;