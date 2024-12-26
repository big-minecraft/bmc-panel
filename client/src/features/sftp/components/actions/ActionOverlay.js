import React from 'react';
import {Check, Trash2, MoveVertical, Download, Archive, X} from 'lucide-react';
import {useSFTPState} from '../../context/SFTPContext';
import {useFileOperations} from '../../hooks/useFileOperations';
import {useArchiveOperations} from '../../hooks/useArchiveOperations';
import {useModalControls} from '../../hooks/useModalControls';
import {useFileSelection} from '../../hooks/useFileSelection';

const ActionOverlay = () => {
    const {selectedFiles, loading} = useSFTPState();
    const {clearSelection} = useFileSelection();
    const {handleMassDownload} = useFileOperations();
    const {handleMassArchive} = useArchiveOperations();
    const {openDeleteModal, openMoveModal} = useModalControls();

    if (selectedFiles.length === 0) return null;

    const ActionButton = ({onClick, disabled, icon: Icon, label, variant = "default"}) => {
        const baseClasses = "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full transition-colors disabled:opacity-50";
        const variants = {
            default: "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50",
            danger: "text-red-600 bg-white border border-red-200 hover:bg-red-50",
            primary: "text-blue-600 bg-white border border-blue-200 hover:bg-blue-50"
        };

        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`${baseClasses} ${variants[variant]}`}
                title={label}
            >
                <Icon size={16} className="mr-1.5"/>
                <span className="hidden sm:inline">{label}</span>
            </button>
        );
    };

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 min-w-[500px]">
            <div className="bg-white rounded-full p-2 border border-gray-200">
                <div className="flex items-center justify-between px-3">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <Check size={16} className="text-primary mr-2"/>
                            <span className="text-gray-600 text-sm font-medium">
                                {selectedFiles.length} selected
                            </span>
                        </div>

                        <div className="h-4 w-px bg-gray-200"/>

                        <div className="flex items-center gap-2">
                            <ActionButton
                                onClick={() => openDeleteModal(selectedFiles)}
                                disabled={loading.deleting}
                                icon={Trash2}
                                label="Delete"
                                variant="danger"
                            />
                            <ActionButton
                                onClick={() => openMoveModal(selectedFiles)}
                                disabled={loading.moving}
                                icon={MoveVertical}
                                label="Move"
                            />
                            <ActionButton
                                onClick={() => handleMassDownload(selectedFiles)}
                                disabled={loading.downloading}
                                icon={Download}
                                label="Download"
                                variant="primary"
                            />
                            <ActionButton
                                onClick={() => handleMassArchive(selectedFiles)}
                                disabled={loading.archiving}
                                icon={Archive}
                                label="Archive"
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="h-4 w-px bg-gray-200 mx-2"/>
                        <button
                            onClick={clearSelection}
                            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                            title="Close"
                        >
                            <X size={16}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionOverlay;