import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';

const Breadcrumb = ({ currentDirectory, onNavigate }) => {
    const parts = currentDirectory.split('/').filter(Boolean);

    return (
        <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-3 p-3 bg-light rounded">
                <li className="breadcrumb-item">
                    <button
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => onNavigate('/nfsshare')}
                    >
                        <FontAwesomeIcon icon={faFolder} className="me-2 text-primary"/>
                        Root
                    </button>
                </li>
                {parts.map((dir, index) => (
                    <li key={index} className={`breadcrumb-item ${index === parts.length - 1 ? 'active' : ''}`}>
                        {index === parts.length - 1 ? (
                            <span>
                <FontAwesomeIcon icon={faFolder} className="me-2 text-warning"/>
                                {dir}
              </span>
                        ) : (
                            <button
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => onNavigate('/' + parts.slice(0, index + 1).join('/'))}
                            >
                                <FontAwesomeIcon icon={faFolder} className="me-2 text-primary"/>
                                {dir}
                            </button>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;