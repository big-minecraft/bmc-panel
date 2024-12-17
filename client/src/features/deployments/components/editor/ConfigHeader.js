import React from 'react';

const ConfigHeader = ({ title, onBack, onSave, isSaving }) => {
    return (
        <div className="row mb-3 content-container">
            <div className="col d-flex justify-content-between align-items-center">
                <div>
                    <h1 className="h3 mb-0">Editing: {title}</h1>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-secondary"
                        onClick={onBack}
                    >
                        Back
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>
            </div>
            <style>
                {`
          .content-container {
            margin-top: 30px;
          }
        `}
            </style>
        </div>
    );
};

export default ConfigHeader;