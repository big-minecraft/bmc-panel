import {Link} from 'react-router-dom';
import {Users, Activity} from 'lucide-react';
import {InstanceState} from "../../../../../../shared/enum/enums/instance-state.ts";
import {Enum} from "../../../../../../shared/enum/enum.ts";


const InstanceCard = ({instance, deploymentName, linkPrefix = "/instance"}) => {
    const playerCount = instance.players ? Object.keys(instance.players).length : -1;
    const instanceState: InstanceState = Enum.InstanceState.fromString(instance.state);
    //TODO: the above instance state is sometimes returning as an object and sometimes as an identifier

    return (
        <Link
            to={`${linkPrefix}/${deploymentName}/${instance.uid}`}
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
                        {playerCount != -1 && (
                            <div
                                className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                                <Users size={14}/>
                                <span className="text-sm font-medium">{playerCount}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Activity size={14} className={instanceState.color}/>
                            <span className={`text-sm ${instanceState.color}`}>{instanceState.displayName}</span>
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
