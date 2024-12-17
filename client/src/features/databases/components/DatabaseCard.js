import React, { useState } from 'react';
import { useDatabases } from '../context/DatabasesContext';
import { KeyIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '../icons/DatabaseIcons'

export const DatabaseCard = ({ database, onShowCredentials, showCredentials, onDelete, onReset }) => {
    const { name, size, tables, credentials } = database;
    const { resettingPassword } = useDatabases();

    return (
        <div className="card">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex flex-column justify-content-center">
                        <h5 className="card-title mb-1">{name}</h5>
                        <p className="card-text text-muted small mb-0">
                            Size: {size} • Tables: {tables}
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <button
                            className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => onReset(name)}
                            disabled={resettingPassword}
                        >
                            {resettingPassword ? (
                                <span className="spinner-border spinner-border-sm" />
                            ) : (
                                <KeyIcon />
                            )}
                        </button>

                        <button
                            className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => onDelete(name)}
                        >
                            <TrashIcon />
                        </button>

                        <button
                            className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => onShowCredentials(name)}
                        >
                            {showCredentials ? <EyeSlashIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>

                {showCredentials && (
                    <div className="mt-2 p-3 bg-light rounded">
                        <h6 className="mb-2">Connection Details</h6>
                        <div className="row g-2">
                            <div className="col-md-6">
                                <div className="input-group">
                                    <span className="input-group-text">Username</span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={credentials.username}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="input-group">
                                    <span className="input-group-text">Password</span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={credentials.password}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="input-group">
                                    <span className="input-group-text">Host</span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={credentials.host}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="input-group">
                                    <span className="input-group-text">Port</span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={credentials.port}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};