import React from 'react';
import {useFileSyncListener} from "../listenerhooks/file-sync-listener.ts";

/**
 * This component doesn't render anything visible but registers all socket listeners
 * in one central place.
 */
export const SocketListenersRegistry: React.FC = () => {
    useFileSyncListener();
    return null;
};