import { useState } from 'react';
import { CheckCircle, RotateCw } from 'lucide-react';

const SyncStatus = () => {
    // In a real implementation, this would come from your context
    const [isSynced, setIsSynced] = useState(true);

    // For dev testing only - toggle the sync state
    const toggleSyncState = () => {
        console.log('toggling sync state')
        setIsSynced(!isSynced);
    };

    return (
        <div
            onClick={toggleSyncState}
            className="cursor-pointer relative flex items-center justify-center"
            title={isSynced ? "Files are synced" : "Synchronizing files..."}
        >
            {isSynced ? (
                <CheckCircle
                    size={24}
                    className="text-indigo-600"
                />
            ) : (
                <RotateCw
                    size={24}
                    className="text-amber-500 animate-spin"
                />
            )}
        </div>
    );
};

export default SyncStatus;