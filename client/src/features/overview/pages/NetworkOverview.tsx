import {useState, useEffect} from 'react';
import {Server} from 'lucide-react';
import axiosInstance from '../../../utils/auth';
import DeploymentCard from "../components/home/DeploymentCard";

const NetworkOverview = () => {
    const [instances, setInstances] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const deploymentsRes = await axiosInstance.get('/api/deployments');
            const fetchedDeployments = deploymentsRes.data.data.deployments;

            const instanceRequests = fetchedDeployments.map(deployment =>
                axiosInstance.get(`/api/deployments/${deployment.name}/instances`)
            );
            const instancesResponses = await Promise.all(instanceRequests);
            const allInstances = instancesResponses.flatMap(res => res.data.data.instances);

            const deploymentsWithInstances = fetchedDeployments.map(deployment => ({
                ...deployment,
                instances: allInstances.filter(instance => instance.deployment === deployment.name)
            }));

            setInstances(deploymentsWithInstances);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 3000);
        return () => clearInterval(intervalId);
    }, []);

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
                        {[
                            ...instances.filter((d) => d.name === "proxy" && d.instances.length > 0),
                            ...instances.filter((d) => d.name !== "proxy" && d.instances.length > 0)
                                .sort((a, b) => a.name.localeCompare(b.name))
                        ].map((deployment) => (
                            <DeploymentCard
                                key={deployment.name}
                                deployment={deployment.name}
                                title={deployment.name.charAt(0).toUpperCase() + deployment.name.slice(1)}
                                instances={deployment.instances}
                                icon={Server}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NetworkOverview;