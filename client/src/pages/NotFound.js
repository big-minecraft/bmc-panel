import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="d-flex align-items-start justify-content-center h-100 pt-5 mt-5">
            <div className="card shadow-sm" style={{ maxWidth: '400px' }}>
                <div className="card-body text-center p-5">
                    <h1 className="display-4 mb-4">404</h1>
                    <h2 className="h4 mb-4">Page Not Found</h2>
                    <p className="text-muted mb-4">
                        The page you're looking for doesn't exist.
                    </p>
                    <Link
                        to="/"
                        className="btn btn-primary"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;