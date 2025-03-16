import { createContext, useContext, useState } from 'react';

const DeployButtonContext = createContext({
    isVisible: false,
    setIsVisible: () => {},
});

export const DeployButtonProvider = ({ children }) => {
    const [isVisible, setIsVisible] = useState(true);

    const value = {
        isVisible,
        setIsVisible,
    };

    return (
        <DeployButtonContext.Provider value={value}>
            {children}
        </DeployButtonContext.Provider>
    );
};

export const useDeployButton = () => {
    const context = useContext(DeployButtonContext);
    if (context === undefined) {
        throw new Error('useDeployButton must be used within a DeployButtonProvider');
    }
    return context;
};