import { CheckCircle, RotateCw } from 'lucide-react';
import {useGlobalState} from "../../../../context/GlobalContext.tsx";

const SyncStatus = () => {
    const { areFilesSynced } = useGlobalState();

    return (
        <div
            className="cursor-pointer relative flex items-center justify-center"
        >
            {areFilesSynced ? (
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