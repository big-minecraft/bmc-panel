import { useState } from 'react';
import { useDeploymentsContext } from '../context/DeploymentsContext.js';
import axiosInstance from '../../../utils/auth';

export const useProxy = () => {
    const {
        proxyConfig,
        setProxyConfig,
        restartingProxy,
        setRestartingProxy
    } = useDeploymentsContext();

    const [error, setError] = useState(null);

    const fetchProxyConfig = async () => {
        try {
            const response = await axiosInstance.get('/api/proxy-config');
            setProxyConfig(response.data);
            setError(null);
        } catch (err) {
            console.error('error fetching proxy config:', err);
            setError('Failed to load proxy configuration');
        }
    };

    const toggleProxy = async (currentState) => {
        try {
            await axiosInstance.patch('/api/proxy', {
                enabled: !currentState
            });
            setProxyConfig(prev => ({ ...prev, enabled: !currentState }));
            return true;
        } catch (err) {
            console.error('error toggling proxy:', err);
            return false;
        }
    };

    const restartProxy = async () => {
        setRestartingProxy(true);
        try {
            await axiosInstance.post('/api/proxy');
            await fetchProxyConfig();
            return true;
        } catch (err) {
            console.error('error restarting proxy:', err);
            return false;
        } finally {
            setRestartingProxy(false);
        }
    };

    return {
        proxyConfig,
        error,
        fetchProxyConfig,
        toggleProxy,
        restartProxy,
        restartingProxy
    };
};