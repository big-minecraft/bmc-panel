import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';

const DragDropOverlay = ({ active }) => {
    if (!active) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 1050,
            }}
        >
            <div
                className="text-center text-white p-4 rounded"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            >
                <FontAwesomeIcon icon={faCloudUploadAlt} size="3x" className="mb-3" />
                <h4>Drop files here to upload</h4>
            </div>
        </div>
    );
};

export default DragDropOverlay;