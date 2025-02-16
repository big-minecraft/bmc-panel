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
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-12 px-4 flex items-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-75"
            >
                {uploading ? (
                    <>
                        <Loader2 size={20} className="animate-spin mr-2"/>
                        <span className="text-sm font-medium">{progress}%</span>
                    </>
                ) : (
                    <>
                        <Upload size={20} className="mr-2"/>
                        <span className="text-sm font-medium">Upload Files</span>
                    </>
                )}
            </button>
            {uploading && (
                <div className="absolute -bottom-1 left-2 right-2 h-1 bg-blue-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-300"
                        style={{width: `${progress}%`}}
                    />
                </div>
            )}
        </div>
    );
};

export default UploadButton;