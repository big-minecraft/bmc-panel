import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faFolderPlus } from '@fortawesome/free-solid-svg-icons';

const CreateActions = ({
   newFileName,
   newDirName,
   onFileNameChange,
   onDirNameChange,
   onCreateFile,
   onCreateDir,
   loading
}) => {
    // Local state for validation
    const [fileError, setFileError] = useState('');
    const [dirError, setDirError] = useState('');

    // Handle file creation with validation
    const handleCreateFile = (e) => {
        e.preventDefault(); // Prevent form submission
        if (!newFileName || newFileName.trim() === '') {
            setFileError('Please enter a file name');
            return;
        }
        setFileError('');
        onCreateFile(newFileName);
    };

    // Handle directory creation with validation
    const handleCreateDir = (e) => {
        e.preventDefault(); // Prevent form submission
        if (!newDirName || newDirName.trim() === '') {
            setDirError('Please enter a directory name');
            return;
        }
        setDirError('');
        onCreateDir(newDirName);
    };

    // Handle file name input change
    const handleFileNameChange = (value) => {
        setFileError('');
        onFileNameChange(value);
    };

    // Handle directory name input change
    const handleDirNameChange = (value) => {
        setDirError('');
        onDirNameChange(value);
    };

    return (
        <>
            <div className="col-md-4 mb-3 mb-md-0">
                <div className={`input-group ${fileError ? 'has-validation' : ''}`}>
                    <input
                        type="text"
                        className={`form-control ${fileError ? 'is-invalid' : ''}`}
                        placeholder="New file name"
                        value={newFileName}
                        onChange={(e) => handleFileNameChange(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleCreateFile}
                        disabled={loading || !newFileName}
                        type="button"
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                        ) : (
                            <FontAwesomeIcon icon={faFile} className="me-2" />
                        )}
                        Create File
                    </button>
                    {fileError && (
                        <div className="invalid-feedback">{fileError}</div>
                    )}
                </div>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
                <div className={`input-group ${dirError ? 'has-validation' : ''}`}>
                    <input
                        type="text"
                        className={`form-control ${dirError ? 'is-invalid' : ''}`}
                        placeholder="New directory name"
                        value={newDirName}
                        onChange={(e) => handleDirNameChange(e.target.value)}
                        disabled={loading}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleCreateDir}
                        disabled={loading || !newDirName}
                        type="button"
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                        ) : (
                            <FontAwesomeIcon icon={faFolderPlus} className="me-2" />
                        )}
                        Create Directory
                    </button>
                    {dirError && (
                        <div className="invalid-feedback">{dirError}</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CreateActions;