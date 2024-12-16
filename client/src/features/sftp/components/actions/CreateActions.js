import React from 'react';
import { useCreateOperations } from '../../hooks/useCreateOperations';
import { File, FolderPlus } from 'lucide-react';

const CreateActions = () => {
    const {
        newFileName,
        newDirName,
        loading,
        setNewFileName,
        setNewDirName,
        handleCreateFile,
        handleCreateDir,
        fileError,
        dirError
    } = useCreateOperations();

    return (
        <>
            <div className="flex-grow-1">
                <div className={`input-group ${fileError ? 'has-validation' : ''}`}>
                    <input
                        type="text"
                        className={`form-control ${fileError ? 'is-invalid' : ''}`}
                        placeholder="New file name"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
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
                            <File size={18} className="me-2" />
                        )}
                        Create File
                    </button>
                    {fileError && (
                        <div className="invalid-feedback">{fileError}</div>
                    )}
                </div>
            </div>

            <div className="flex-grow-1">
                <div className={`input-group ${dirError ? 'has-validation' : ''}`}>
                    <input
                        type="text"
                        className={`form-control ${dirError ? 'is-invalid' : ''}`}
                        placeholder="New directory name"
                        value={newDirName}
                        onChange={(e) => setNewDirName(e.target.value)}
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
                            <FolderPlus size={18} className="me-2" />
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