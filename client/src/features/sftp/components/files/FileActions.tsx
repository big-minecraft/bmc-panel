import React, { useState, useRef, useEffect } from 'react';
import {
    Download,
    Pencil,
    Archive,
    PackageOpen,
    Trash2,
    Loader2,
    MoreVertical
} from 'lucide-react';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useArchiveOperations } from '../../hooks/useArchiveOperations';
import { useSFTPState, useSFTPDispatch } from '../../context/SFTPContext';

const FileActions = ({ file }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const { loading } = useSFTPState();
    const dispatch = useSFTPDispatch();
    const { handleDownload } = useFileOperations();
    const { handleArchive, handleUnarchive } = useArchiveOperations();

    const isLoading = loading.downloading || loading.archiving || loading.deleting;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const MenuItem = ({ onClick, icon: Icon, label, variant = "default", disabled = false }) => {
        const variants = {
            default: "text-gray-700 hover:bg-gray-50",
            danger: "text-red-600 hover:bg-red-50",
            primary: "text-blue-600 hover:bg-blue-50"
        };

        return (
            <button
                onClick={() => {
                    onClick();
                    setIsOpen(false);
                }}
                disabled={disabled || isLoading}
                className={`w-full flex items-center px-3 py-2 text-sm ${variants[variant]} disabled:opacity-50`}
            >
                <Icon size={16} className="mr-2" />
                {label}
            </button>
        );
    };

    const openRenameModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'rename',
                state: { isOpen: true, file }
            }
        });
    };

    const openDeleteModal = () => {
        dispatch({
            type: 'SET_MODAL_STATE',
            payload: {
                modal: 'delete',
                state: { isOpen: true, files: [file] }
            }
        });
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <MoreVertical size={16} />
                )}
            </button>

            {isOpen && (
                <div
                    className="fixed right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                    style={{
                        top: 'auto',
                        marginTop: '4px',
                    }}
                >
                    <MenuItem
                        onClick={() => handleDownload(file)}
                        icon={Download}
                        label={`Download ${file.type === 'd' ? 'Directory' : 'File'}`}
                        variant="primary"
                    />
                    <MenuItem
                        onClick={openRenameModal}
                        icon={Pencil}
                        label={`Rename ${file.type === 'd' ? 'Directory' : 'File'}`}
                    />
                    <MenuItem
                        onClick={() => file.isArchived ? handleUnarchive(file) : handleArchive(file)}
                        icon={file.isArchived ? PackageOpen : Archive}
                        label={`${file.isArchived ? 'Unarchive' : 'Archive'} ${file.type === 'd' ? 'Directory' : 'File'}`}
                    />
                    <div className="border-t border-gray-100 my-1"></div>
                    <MenuItem
                        onClick={openDeleteModal}
                        icon={Trash2}
                        label={`Delete ${file.type === 'd' ? 'Directory' : 'File'}`}
                        variant="danger"
                    />
                </div>
            )}
        </div>
    );
};

export default FileActions;