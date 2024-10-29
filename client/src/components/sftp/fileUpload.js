import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';

const FileUpload = ({ onUpload, uploading }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files?.length > 0) {
            onUpload(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="col-md-4">
            <div className="input-group">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="d-none"
                    onChange={handleFileChange}
                    multiple
                    disabled={uploading}
                />
                <button
                    className="btn btn-primary w-100 rounded"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="me-2" />
                    Upload Files
                </button>
            </div>
        </div>
    );
};

export default FileUpload;