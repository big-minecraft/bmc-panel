import React, {createContext, useContext, useState} from 'react';

const DeploymentsContext = createContext(null);

export const DeploymentsProvider = ({children}) => {
    const [deployments, setDeployments] = useState([]);
    const [proxyConfig, setProxyConfig] = useState(null);
    const [restartingDeployments, setRestartingDeployments] = useState(new Set());
    const [restartingProxy, setRestartingProxy] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState('');
    const [isLoadingNodes, setIsLoadingNodes] = useState(false);
    const [deploymentToDelete, setDeploymentToDelete] = useState(null);

    const value = {
        deployments,
        setDeployments,
        proxyConfig,
        setProxyConfig,
        restartingDeployments,
        setRestartingDeployments,
        restartingProxy,
        setRestartingProxy,
        notifications,
        setNotifications,
        nodes,
        setNodes,
        selectedNode,
        setSelectedNode,
        isLoadingNodes,
        setIsLoadingNodes,
        deploymentToDelete,
        setDeploymentToDelete
    };

    return (
        <DeploymentsContext.Provider value={value}>
            {children}
        </DeploymentsContext.Provider>
    );
};

export const useDeploymentsContext = () => {
    const context = useContext(DeploymentsContext);
    if (context === null) {
        throw new Error('useDeploymentsContext must be used within a DeploymentsProvider');
    }
    return context;
};