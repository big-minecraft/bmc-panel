import React from 'react';
import { Folder } from 'lucide-react';
import { useSFTPState } from '../../context/SFTPContext';
import { useFileNavigation } from '../../hooks/useFileNavigation';

const Breadcrumb = () => {
    const { currentDirectory } = useSFTPState();
    const { handleDirectoryChange } = useFileNavigation();
    const parts = currentDirectory.split('/').filter(Boolean);

    return (
        <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-3 p-3 bg-light rounded">
                <li className="breadcrumb-item">
                    <button
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => handleDirectoryChange('/nfsshare')}
                    >
                        <Folder size={16} className="me-2 text-primary"/>
                        Root
                    </button>
                </li>
                {parts.map((dir, index) => (
                    <li key={index} className={`breadcrumb-item ${index === parts.length - 1 ? 'active' : ''}`}>
                        {index === parts.length - 1 ? (
                            <span>
                                <Folder size={16} className="me-2 text-warning"/>
                                {dir}
                            </span>
                        ) : (
                            <button
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => handleDirectoryChange('/' + parts.slice(0, index + 1).join('/'))}
                            >
                                <Folder size={16} className="me-2 text-primary"/>
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