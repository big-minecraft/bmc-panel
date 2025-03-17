import {useRef} from 'react';
import {Upload, Loader2} from 'lucide-react';
import {useSFTPState} from '../../context/SFTPContext';
import {useFileOperations} from '../../hooks/useFileOperations';

const UploadButton = () => {
    const fileInputRef = useRef(null);
    const {uploadState: {uploading, progress}} = useSFTPState();
    const {uploadFiles} = useFileOperations();

    const handleFileChange = (e) => {
        if (e.target.files?.length > 0) {
            uploadFiles(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                disabled={uploading}
            />

            <div className="w-40">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="relative w-full h-12 flex items-center justify-center bg-indigo-600 text-white rounded-lg shadow-md hover:opacity-90 transition-opacity duration-300 overflow-hidden"
                >
                    {uploading && (
                        <div className="absolute inset-0 bg-indigo-800"
                             style={{
                                 clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`,
                                 transition: 'clip-path 50ms linear'
                             }}
                        />
                    )}

                    {/* Button content */}
                    <div className="flex items-center justify-center z-10 relative">
                        {uploading ? (
                            <>
                                <Loader2 size={18} className="animate-spin mr-2"/>
                                {/*<span className="text-sm font-semibold">{progress}%</span>*/}
                                <span className="text-sm font-semibold">Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={18} className="mr-2"/>
                                <span className="text-sm font-semibold">Upload Files</span>
                            </>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
};

export default UploadButton;