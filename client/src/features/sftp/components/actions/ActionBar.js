import React from 'react';
import CreateActions from './CreateActions';
import FileUpload from './FileUpload';
import { useSFTPState } from '../../context/SFTPContext';

const ActionBar = () => {
    const { loading } = useSFTPState();

    return (
        <div className="row mb-4 g-3">
            <div className="col-12 col-md-8">
                <div className="d-flex gap-3">
                    <CreateActions loading={loading.creating} />
                </div>
            </div>
            <div className="col-12 col-md-4">
                <FileUpload />
            </div>
        </div>
    );
};

export default ActionBar;