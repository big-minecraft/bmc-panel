import {createContext, useContext, useState} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [authStep, setAuthStep] = useState(1);
    const [sessionToken, setSessionToken] = useState('');

    const value = {
        error,
        setError,
        loading,
        setLoading,
        authStep,
        setAuthStep,
        sessionToken,
        setSessionToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};