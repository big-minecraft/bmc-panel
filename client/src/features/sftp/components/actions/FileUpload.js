import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useSFTPState } from '../../context/SFTPContext';
import { useFileOperations } from '../../hooks/useFileOperations';

const FileUpload = () => {
    const fileInputRef = useRef(null);
    const { uploadState: { uploading, progress, error } } = useSFTPState();
    const { uploadFiles } = useFileOperations();

    const handleFileChange = (e) => {
        if (e.target.files?.length > 0) {
            uploadFiles(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="position-relative">
            <input
                type="file"
                ref={fileInputRef}
                className="d-none"
                onChange={handleFileChange}
                multiple
                disabled={uploading}
            />

            <button
                className="btn btn-primary w-100"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                ) : (
                    <Upload size={18} className="me-2" />
                )}
                Upload Files
            </button>

            {uploading && (
                <div
                    className="progress position-absolute bottom-0 start-0 w-100"
                    style={{ height: '4px' }}
                >
                    <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style={{ width: `${progress}%` }}
                        aria-valuenow={progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                    />
                </div>
            )}

            {error && (
                <div className="position-absolute top-100 start-0 w-100 mt-2">
                    <div className="alert alert-danger py-2 px-3 mb-0 small">
                        {error}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;