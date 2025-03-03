import {useState} from 'react';
import {useDeploymentsContext} from '../context/DeploymentsContext';
import axiosInstance from '../../../utils/auth';
import {Enum} from "../../../../../shared/enum/enum.ts";

export const useDeployments = () => {
    const {
        deployments,
        setDeployments,
        getDeploymentsByType,
        games,
        proxy,
        processes,
        restartingDeployments,
        setRestartingDeployments
    } = useDeploymentsContext();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDeployments = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/deployments');
            const deployments = response.data.data.deployments.map(deployment => {
                const { typeIndex, ...rest } = deployment;
                return {
                    ...rest,
                    type: Enum.DeploymentType.fromIndex(typeIndex)
                };
            });
            setDeployments(deployments);
            setError(null);
        } catch (err) {
            setError('Failed to load deployments');
            console.error('error fetching deployments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDeployment = async (deploymentName, currentState) => {
        try {
            await axiosInstance.post(`/api/deployments/${deploymentName}/toggle`, {
                enabled: !currentState
            });

            setDeployments(prevDeployments =>
                prevDeployments.map(deployment =>
                    deployment.name === deploymentName
                        ? {...deployment, enabled: !currentState}
                        : deployment
                )
            );
            return true;
        } catch (err) {
            console.error('error toggling deployment:', err);
            return false;
        }
    };

    const restartDeployment = async (deploymentName) => {
        setRestartingDeployments(prev => new Set([...prev, deploymentName]));
        try {
            await axiosInstance.post(`/api/deployments/${deploymentName}/restart`);
            await fetchDeployments();
            return true;
        } catch (err) {
            console.error('error restarting deployment:', err);
            return false;
        } finally {
            setRestartingDeployments(prev => {
                const next = new Set(prev);
                next.delete(deploymentName);
                return next;
            });
        }
    };

    const deleteDeployment = async (deploymentName) => {
        try {
            await axiosInstance.delete(`/api/deployments/${deploymentName}`);
            await fetchDeployments();
            return true;
        } catch (err) {
            console.error('error deleting deployment:', err);
            return false;
        }
    };

    const createDeployment = async (data) => {
        try {
            await axiosInstance.post('/api/deployments', data);
            await fetchDeployments();
            return true;
        } catch (err) {
            console.error('error creating deployment:', err);
            return false;
        }
    };

    return {
        deployments,
        getDeploymentsByType,
        games,
        proxy,
        processes,
        isLoading,
        error,
        fetchDeployments,
        deleteDeployment,
        toggleDeployment,
        restartDeployment,
        createDeployment,
        restartingDeployments
    };
};