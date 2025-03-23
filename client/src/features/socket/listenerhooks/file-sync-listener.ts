import { Enum } from "../../../../../shared/enum/enum.ts";
import { useSocketListener } from "../hooks/useSocketListener.ts";
import { ClientFileSync } from "../../../../../shared/types/client-file-sync.ts";
import { useCallback } from "react";
import { useGlobalDispatch } from "../../../context/GlobalContext.tsx";

export function useFileSyncListener() {
    const dispatch = useGlobalDispatch();

    const handleFileSync = useCallback((message: ClientFileSync) => {
        if (message.event === 'sync_started') {
            dispatch({ type: 'SET_FILES_SYNCED', payload: false });
            console.log('sync started');
        } else if (message.event === 'sync_completed') {
            dispatch({ type: 'SET_FILES_SYNCED', payload: true });
            console.log('sync completed');
        }
    }, [dispatch]);

    useSocketListener<ClientFileSync>(
        Enum.SocketMessageType.CLIENT_FILE_SYNC,
        handleFileSync
    );
}