import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../utils/auth';
import InstanceCard from "../components/instances/home/InstanceCard";

const Home = ({ instances: initialInstances, proxies: initialProxies }) => {
    const [instances, setInstances] = useState(initialInstances);
    const [proxies, setProxies] = useState(initialProxies);
    const location = useLocation();

    useEffect(() => {
        setInstances(initialInstances);
        setProxies(initialProxies);
    }, [initialInstances, initialProxies]);

    const fetchData = async () => {
        try {
            const [instancesRes, proxiesRes] = await Promise.all([
                axiosInstance.get('/api/instances'),
                axiosInstance.get('/api/proxies')
            ]);

            setInstances(instancesRes.data);
            setProxies(proxiesRes.data);
        } catch (err) {
            console.error(err);
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
        <div className="container">
            <div className="row g-4 mb-4">
                <div className="col-12">
                    <h2 className="h5 mb-3">Proxies</h2>
                    {proxies.map((proxy, index) => (
                        <InstanceCard
                            key={index}
                            instance={proxy}
                            linkPrefix="/proxy"
                        />
                    ))}
                </div>
            </div>
            <div className="row g-4">
                {sortedDeployments.map((deployment) => (
                    <div key={deployment} className="col-12">
                        <h2 className="h5 mb-3">
                            {deployment.charAt(0).toUpperCase() + deployment.slice(1)}
                        </h2>
                        {instancesByDeployment[deployment].map((instance, index) => (
                            <InstanceCard
                                key={index}
                                instance={instance}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;