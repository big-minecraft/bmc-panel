import React from 'react';
import {Link} from 'react-router-dom';
import {Users, Activity} from 'lucide-react';
import {getInstanceStateDetails} from '../../constants/instanceState';

const InstanceCard = ({instance, linkPrefix = "/instance"}) => {
    const playerCount = Object.keys(instance.players).length;
    const stateDetails = getInstanceStateDetails(instance.state);

    return (
        <Link
            to={`${linkPrefix}/${instance.name}`}
            state={{instance}}
            className="block group"
        >
            <div className="bg-white rounded-xl p-6 border border-gray-200 transition-all duration-300
                          hover:shadow-lg hover:border-blue-200">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600
                                       transition-colors duration-200">
                                {instance.name}
                            </h3>
                            {instance.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {instance.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                            <Users size={14}/>
                            <span className="text-sm font-medium">{playerCount}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Activity size={14} className={stateDetails.color}/>
                            <span className={`text-sm ${stateDetails.color}`}>{stateDetails.display}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                            ID: {instance.name.split('-')[0]}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default InstanceCard;
