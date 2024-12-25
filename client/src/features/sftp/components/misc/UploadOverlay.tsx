import React from 'react';
import {Upload} from 'lucide-react';
import {useFileOperations} from '../../hooks/useFileOperations';
import useDragAndDrop from '../../hooks/useDragAndDrop';

const UploadOverlay = () => {
    const {uploadFiles} = useFileOperations();
    const dragActive = useDragAndDrop(uploadFiles);

    if (!dragActive) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-black/80 rounded-2xl p-8 text-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        <Upload size={32} className="text-white"/>
                    </div>
                    <h4 className="text-xl font-medium text-white">
                        Drop files here to upload
                    </h4>
                </div>
            </div>
        </div>
    );
};

export default UploadOverlay;