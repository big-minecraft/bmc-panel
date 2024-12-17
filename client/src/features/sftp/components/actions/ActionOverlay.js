import React from 'react';
import { Check, Trash2, MoveVertical, Download, Archive, X } from 'lucide-react';
import { useSFTPState, useSFTPDispatch } from '../../context/SFTPContext';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useArchiveOperations } from '../../hooks/useArchiveOperations';
import { useModalControls } from '../../hooks/useModalControls';
import { useFileSelection } from '../../hooks/useFileSelection';

const ActionOverlay = () => {
    const { selectedFiles, loading } = useSFTPState();
    const { clearSelection } = useFileSelection();
    const { handleMassDownload } = useFileOperations();
    const { handleMassArchive } = useArchiveOperations();
    const { openDeleteModal, openMoveModal } = useModalControls();

    if (selectedFiles.length === 0) return null;

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 min-w-[500px]">
            <div className="bg-white shadow-lg rounded-full p-2">
                <div className="flex items-center justify-between px-3">
                    <div className="flex items-center">
                        <div className="flex items-center mr-3">
                            <Check size={16} className="text-primary mr-2" />
                            <span className="text-gray-600 text-sm font-medium">
                                {selectedFiles.length} selected
                            </span>
                        </div>

                        <div className="w-px h-4 bg-gray-200 mx-2" />

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openDeleteModal(selectedFiles)}
                                disabled={loading.deleting}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-full hover:bg-red-50 disabled:opacity-50"
                                title="Delete"
                            >
                                <Trash2 size={16} className="mr-1.5" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>

                            <button
                                onClick={openMoveModal}
                                disabled={loading.moving}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50"
                                title="Move"
                            >
                                <MoveVertical size={16} className="mr-1.5" />
                                <span className="hidden sm:inline">Move</span>
                            </button>

                            <button
                                onClick={() => handleMassDownload()}
                                disabled={loading.downloading}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-full hover:bg-blue-50 disabled:opacity-50"
                                title="Download"
                            >
                                <Download size={16} className="mr-1.5" />
                                <span className="hidden sm:inline">Download</span>
                            </button>

                            <button
                                onClick={() => handleMassArchive()}
                                disabled={loading.archiving}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50"
                                title="Archive"
                            >
                                <Archive size={16} className="mr-1.5" />
                                <span className="hidden sm:inline">Archive</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="w-px h-4 bg-gray-200 mx-2" />
                        <button
                            onClick={clearSelection}
                            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                            title="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionOverlay;