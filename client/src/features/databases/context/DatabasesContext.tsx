import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from "../../../utils/auth";

const DatabasesContext = createContext(null);

export const DatabasesProvider = ({ children }) => {
    const [databases, setDatabases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDatabases = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/databases');
            console.log(response.data);
            setDatabases(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load databases');
            console.error('error fetching databases:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createDatabase = useCallback(async (name) => {
        const response = await axiosInstance.post('/api/databases', { name });
        await fetchDatabases();
        return response.data;
    }, [fetchDatabases]);

    const deleteDatabase = useCallback(async (name) => {
        await axiosInstance.delete(`/api/databases/${name}`);
        await fetchDatabases();
    }, [fetchDatabases]);

    const resetPassword = useCallback(async (name) => {
        const response = await axiosInstance.patch(`/api/databases/${name}`);
        await fetchDatabases();
        return response.data;
    }, [fetchDatabases]);

    const value = {
        databases,
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