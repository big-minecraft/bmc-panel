import React from 'react';
import {Folder, ChevronRight} from 'lucide-react';
import {useFilesState} from '../../context/FilesContext';
import {useFileNavigation} from '../../hooks/useFileNavigation';

const Breadcrumb = () => {
    const {currentDirectory} = useFilesState();
    const {handleDirectoryChange} = useFileNavigation();
    const parts = currentDirectory.split('/').filter(Boolean);

    return (
        <nav className="flex items-center overflow-x-auto">
            <ol className="flex items-center gap-1">
                <li>
                    <button
                        onClick={() => handleDirectoryChange('/minecraft')}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <Folder size={16} className="mr-1"/>
                        Root
                    </button>
                </li>

                {parts.map((dir, index) => (
                    <React.Fragment key={index}>
                        <ChevronRight size={16} className="text-gray-400"/>
                        <li>
                            {index === parts.length - 1 ? (
                                <span className="flex items-center text-sm text-gray-600">
                                    <Folder size={16} className="mr-1 text-yellow-500"/>
                                    {dir}
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleDirectoryChange('/' + parts.slice(0, index + 1).join('/'))}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <Folder size={16} className="mr-1"/>
                                    {dir}
                                </button>
                            )}
                        </li>
                    </React.Fragment>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;