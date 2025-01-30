import React, {createContext, useContext, useState, useCallback} from 'react';
import axiosInstance from "../../../utils/auth";
import type {Database} from '../types/types';

interface DatabasesContextValue {
    sqlDatabases: Database[];
    mongoDatabases: Database[];
    isLoading: boolean;
    error: string | null;
    fetchDatabases: () => Promise<void>;
    createDatabase: (name: string, type: 'sql' | 'mongo') => Promise<Database>;
    deleteDatabase: (name: string, type: 'sql' | 'mongo') => Promise<void>;
    resetPassword: (name: string, type: 'sql' | 'mongo') => Promise<Database>;
}

const DatabasesContext = createContext<DatabasesContextValue | null>(null);

export const DatabasesProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [sqlDatabases, setSqlDatabases] = useState<Database[]>([]);
    const [mongoDatabases, setMongoDatabases] = useState<Database[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDatabases = useCallback(async () => {
        try {
            setIsLoading(true);
            const [sqlResponse, mongoResponse] = await Promise.all([
                axiosInstance.get('/api/database/sql'),
                axiosInstance.get('/api/database/mongo')
            ]);

            setSqlDatabases(sqlResponse.data.data.databases);
            setMongoDatabases(mongoResponse.data.data.databases);
            setError(null);
        } catch (err) {
            setError('Failed to load databases');
            console.error('error fetching databases:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createDatabase = useCallback(async (name: string, type: 'sql' | 'mongo') => {
        const response = await axiosInstance.post(`/api/database/${type}`, {name});
        await fetchDatabases();
        return response.data.data;
    }, [fetchDatabases]);

    const deleteDatabase = useCallback(async (name: string, type: 'sql' | 'mongo') => {
        await axiosInstance.delete(`/api/database/${type}/${name}`);
        await fetchDatabases();
    }, [fetchDatabases]);

    const resetPassword = useCallback(async (name: string, type: 'sql' | 'mongo') => {
        const response = await axiosInstance.patch(`/api/database/${type}/${name}`);
        await fetchDatabases();
        return response.data.data;
    }, [fetchDatabases]);

    const value = {
        sqlDatabases,
        mongoDatabases,
        isLoading,
        error,
        fetchDatabases,
        createDatabase,
        deleteDatabase,
        resetPassword
    };

    return (
        <DatabasesContext.Provider value={value}>
            {children}
        </DatabasesContext.Provider>
    );
};

export const useDatabases = () => {
    const context = useContext(DatabasesContext);
    if (!context) {
        throw new Error('useDatabases must be used within a DatabasesProvider');
    }
    return context;
};