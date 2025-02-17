import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {Enum} from "../../../../../shared/enum/enum.ts";
import {DeploymentType} from "../../../../../shared/enum/enums/deployment-type.ts";

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

    const getDeploymentsByType = useCallback((type: DeploymentType) => {
        if (!type) return deployments;
        return deployments.filter(deployment => deployment.type === type);
    }, [deployments]);

    const games = useMemo(() => {
        return deployments.filter(deployment =>
            deployment.type === Enum.DeploymentType.PERSISTENT ||
            deployment.type === Enum.DeploymentType.SCALABLE
        );
    }, [deployments]);

    const proxy = useMemo(() => {
        return getDeploymentsByType(Enum.DeploymentType.PROXY)[0]!;
    }, [deployments]);

    const value = {
        deployments,
        setDeployments,
        getDeploymentsByType,
        games,
        proxy,
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