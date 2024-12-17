import { useState } from 'react';
import { useDeploymentsContext } from '../context/DeploymentsContext';
import axiosInstance from '../../../utils/auth';

export const useDeployments = () => {
    const {
        deployments,
        setDeployments,
        restartingDeployments,
        setRestartingDeployments
    } = useDeploymentsContext();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDeployments = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/deployments');
            setDeployments(response.data);
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
            await axiosInstance.patch(`/api/deployments/${deploymentName}`, {
                enabled: !currentState
            });

            setDeployments(prevDeployments =>
                prevDeployments.map(deployment =>
                    deployment.name === deploymentName
                        ? { ...deployment, enabled: !currentState }
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
            await axiosInstance.post(`/api/deployments/${deploymentName}`);
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
        isLoading,
        error,
        fetchDeployments,
        toggleDeployment,
        restartDeployment,
        deleteDeployment,
        createDeployment,
        restartingDeployments
    };
};