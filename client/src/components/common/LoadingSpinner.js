import React from 'react';

export const LoadingSpinner = () => (
    <div className="d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    </div>
);

export const ErrorAlert = ({ message }) => (
    <div className="alert alert-danger" role="alert">
        {message}
    </div>
);

export default LoadingSpinner;