import apiClient from '../../../utils/auth';
import {
    FileEditSession,
    SessionListResponse,
    SessionStatusResponse
} from '../types/fileTypes';

export const useFileSessions = () => {
    const createSession = async (deploymentName: string): Promise<FileEditSession> => {
        const response = await apiClient.post<{ success: boolean; data: { session: FileEditSession } }>(
            '/api/files/session/create',
            { deploymentName }
        );
        return response.data.data.session;
    };

    const getSessionStatus = async (sessionId: string): Promise<FileEditSession> => {
        const response = await apiClient.get<{ success: boolean; data: SessionStatusResponse }>(
            '/api/files/session/status',
            { params: { sessionId } }
        );
        return response.data.data.session;
    };

    const endSession = async (sessionId: string): Promise<void> => {
        await apiClient.post('/api/files/session/end', { sessionId });
    };

    const refreshSession = async (sessionId: string): Promise<void> => {
        await apiClient.post('/api/files/session/refresh', { sessionId });
    };

    const listSessionsByDeployment = async (deploymentName: string): Promise<FileEditSession[]> => {
        const response = await apiClient.get<{ success: boolean; data: SessionListResponse }>(
            '/api/files/session/list',
            { params: { deploymentName } }
        );
        return response.data.data.sessions;
    };

    const listAllSessions = async (): Promise<FileEditSession[]> => {
        const response = await apiClient.get<{ success: boolean; data: SessionListResponse }>(
            '/api/files/session/list'
        );
        return response.data.data.sessions;
    };

    return {
        createSession,
        getSessionStatus,
        endSession,
        refreshSession,
        listSessionsByDeployment,
        listAllSessions
    };
};
