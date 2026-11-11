import {Upload, Loader2} from 'lucide-react';
import {useFileOperations} from '../../hooks/useFileOperations';
import {useFilesState} from '../../context/FilesContext';
import useDragAndDrop from '../../hooks/useDragAndDrop';

const UploadOverlay = () => {
    const {uploadFiles} = useFileOperations();
    const {uploadState} = useFilesState();
    const dragActive = useDragAndDrop(uploadFiles);

    if (!dragActive && !uploadState.uploading) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-black/80 rounded-2xl p-8 text-center w-80">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        {uploadState.uploading
                            ? <Loader2 size={32} className="text-white animate-spin"/>
                            : <Upload size={32} className="text-white"/>}
                    </div>

                    {uploadState.uploading ? (
                        <>
                            <h4 className="text-xl font-medium text-white">
                                {uploadState.finishing ? 'Saving to disk' : `Uploading ${uploadState.progress}%`}
                            </h4>
                            <p className="text-sm text-white/70 mt-1">
                                {uploadState.completed} of {uploadState.total} complete
                            </p>
                            <div className="w-full h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-200"
                                    style={{width: `${uploadState.finishing ? 100 : uploadState.progress}%`}}
                                />
                            </div>
                        </>
                    ) : (
                        <h4 className="text-xl font-medium text-white">
                            Drop files or folders here to upload
                        </h4>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadOverlay;
