import React from 'react';
import CPUChart from './CPUChart';
import MemoryChart from './MemoryChart';

const MetricsSection = ({ podName }) => {
    return (
        <>
            <div className="card mb-3">
                <div className="card-header">
                    <h3>CPU Usage</h3>
                </div>
                <div className="card-body">
                    <CPUChart podName={podName}/>
                </div>
            </div>

            <div className="card mb-3">
                <div className="card-header">
                    <h3>Memory Usage</h3>
                </div>
                <div className="card-body">
                    <MemoryChart podName={podName}/>
                </div>
            </div>
        </>
    );
};

export default MetricsSection;