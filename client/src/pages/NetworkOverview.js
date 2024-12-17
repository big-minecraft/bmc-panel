import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Server, Shield } from 'lucide-react';
import axiosInstance from '../utils/auth';
import DeploymentCard from "../components/instances/home/DeploymentCard";

const NetworkOverview = ({ instances: initialInstances, proxies: initialProxies }) => {
    const [instances, setInstances] = useState(initialInstances);
    const [proxies, setProxies] = useState(initialProxies);
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setInstances(initialInstances);
        setProxies(initialProxies);
    }, [initialInstances, initialProxies]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [instancesRes, proxiesRes] = await Promise.all([
                axiosInstance.get('/api/instances'),
                axiosInstance.get('/api/proxies')
            ]);
            setInstances(instancesRes.data);
            setProxies(proxiesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const intervalId = setInterval(fetchData, 3000);
        return () => clearInterval(intervalId);
    }, []);

    const instancesByDeployment = instances.reduce((acc, instance) => {
        const deployment = instance.deployment || 'Unknown';
        if (!acc[deployment]) {
            acc[deployment] = [];
        }
        acc[deployment].push(instance);
        return acc;
    }, {});

    const sortedDeployments = Object.keys(instancesByDeployment).sort();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Network Overview</h1>
                        <div className={`px-3 py-1 rounded-full text-sm 
                            ${isLoading ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                            {isLoading ? 'Updating...' : 'Live'}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <DeploymentCard
                            title="Proxy Servers"
                            instances={proxies}
                            icon={Shield}
                        />

                        {sortedDeployments.map((deployment) => (
                            <DeploymentCard
                                key={deployment}
                                title={deployment.charAt(0).toUpperCase() + deployment.slice(1)}
                                instances={instancesByDeployment[deployment]}
                                icon={Server}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkOverview;