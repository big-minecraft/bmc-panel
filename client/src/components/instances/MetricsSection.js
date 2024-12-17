import React from 'react';
import CPUChart from './CPUChart';
import MemoryChart from './MemoryChart';

const MetricsSection = ({ podName }) => {
    return (
        <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-xl font-semibold text-gray-900">CPU Usage</h3>
                </div>
                <div className="p-6">
                    <CPUChart podName={podName} />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-xl font-semibold text-gray-900">Memory Usage</h3>
                </div>
                <div className="p-6">
                    <MemoryChart podName={podName} />
                </div>
            </div>
        </div>
    );
};

export default MetricsSection;