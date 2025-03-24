import {useState, useEffect} from 'react';
import {Server, AlertTriangle, XCircle} from 'lucide-react';
import axiosInstance from '../../../utils/auth';
import DeploymentCard from "../components/home/DeploymentCard";

const MANAGER_UPDATE_INTERVAL = 30000;

const NetworkOverview = () => {
    const [instances, setInstances] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [managerUpToDate, setManagerUpToDate] = useState(true);
    const [fetchFailed, setFetchFailed] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setFetchFailed(false);

            const managerTimestampRes = await axiosInstance.get('/api/network/getManagerTimestamp');
            const managerTimestamp = managerTimestampRes.data.data.timestamp;

            const isUpToDate = (managerTimestamp > Date.now() - MANAGER_UPDATE_INTERVAL);
            setManagerUpToDate(isUpToDate);

            if (isUpToDate) {
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

                const sorted = deploymentsWithInstances.sort((a, b) => {
                    if (a.typeIndex !== b.typeIndex) return a.typeIndex - b.typeIndex;
                    return a.name.localeCompare(b.name);
                });

                setInstances(sorted);
            }
        } catch (err) {
            console.error(err);
            setFetchFailed(true);
            setErrorMessage(err.response?.data?.message || 'Failed to fetch network data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 3000);

        return () => clearInterval(intervalId);
    }, []);

    const getStatusIndicator = () => {
        if (isLoading) return { text: 'Updating...', classes: 'bg-blue-50 text-blue-600' };
        if (fetchFailed) return { text: 'Failed', classes: 'bg-red-50 text-red-600' };
        return { text: 'Live', classes: 'bg-green-50 text-green-600' };
    };

    const status = getStatusIndicator();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Network Overview</h1>
                        <div className={`px-3 py-1 rounded-full text-sm ${status.classes}`}>
                            {status.text}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {fetchFailed ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-6 w-6 text-red-500" />
                                    <h3 className="font-medium text-red-700">Failed to Load Data</h3>
                                </div>
                                <p className="mt-2 text-red-600">
                                    {errorMessage}
                                </p>
                                <button
                                    onClick={fetchData}
                                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : !managerUpToDate ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                    <h3 className="font-medium text-red-700">Manager Not Responding</h3>
                                </div>
                                <p className="mt-2 text-red-600">
                                    The network manager has not reported status in the last 30 seconds.
                                    Deployment information cannot be displayed until the manager is back online.
                                </p>
                            </div>
                        ) : (
                            instances.map((deployment) => (
                                <DeploymentCard
                                    key={deployment.name}
                                    deployment={deployment.name}
                                    title={deployment.name}
                                    instances={deployment.instances}
                                    icon={Server}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NetworkOverview;