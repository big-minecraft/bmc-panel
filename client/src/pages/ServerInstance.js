import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import Console from "../components/instances/Console";
import InstanceDetails from "../components/instances/InstanceDetails";
import MetricsSection from "../components/instances/MetricsSection";

function ServerInstance({ instances, proxies }) {
    const { instanceName } = useParams();
    const [instance, setInstance] = useState(null);

    useEffect(() => {
        const allInstances = [...instances, ...proxies];
        const currentInstance = allInstances.find(inst => inst.name === instanceName);
        setInstance(currentInstance);
    }, [instanceName, instances, proxies]);

    if (!instance) {
        return <div className="container">Loading...</div>;
    }

    return (
        <div className="container">
            <h1 className="text-center mb-4">{instanceName}</h1>

            <Console podName={instance.podName} />
            <InstanceDetails instance={instance} />
            <MetricsSection podName={instance.podName} />
        </div>
    );
}

export default ServerInstance;