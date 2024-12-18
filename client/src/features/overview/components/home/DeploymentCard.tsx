import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import InstanceCard from './InstanceCard';

const DeploymentCard = ({ title, instances, icon: Icon }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center space-x-3 hover:opacity-75 transition-opacity"
                >
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon size={20} className="text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <div className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-600">
                        {instances.length}
                    </div>
                    {isExpanded ?
                        <ChevronDown size={20} className="text-gray-400 ml-auto" /> :
                        <ChevronRight size={20} className="text-gray-400 ml-auto" />
                    }
                </button>
            </div>
            {isExpanded && (
                <div className="p-6">
                    {instances.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {instances.map((instance, index) => (
                                <InstanceCard key={index} instance={instance} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No instances currently running
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeploymentCard;