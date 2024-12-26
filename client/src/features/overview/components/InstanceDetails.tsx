import React from 'react';

const InstanceDetails = ({instance}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-xl font-semibold text-gray-900">Instance Details</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
                <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-24">Pod Name:</span>
                    <span className="text-gray-900">{instance.podName}</span>
                </div>
                <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-24">IP:</span>
                    <span className="text-gray-900">{instance.ip}</span>
                </div>
                <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-24">Players:</span>
                    <span className="text-gray-900">{Object.keys(instance.players).length}</span>
                </div>
            </div>
        </div>
    );
};

export default InstanceDetails;