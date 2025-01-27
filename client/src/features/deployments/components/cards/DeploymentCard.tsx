import React from 'react';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import {Folder, RotateCcw, Edit, Trash} from 'lucide-react';
import {useDeployments} from '../../hooks/useDeployments';
import {useNotifications} from '../../hooks/useNotifications';
import {useDeploymentsContext} from '../../context/DeploymentsContext';
import DeleteDeploymentModal from "../modals/DeleteDeploymentModal";

const DeploymentCard = ({deployment}) => {
    const navigate = useNavigate();
    const {toggleDeployment, restartDeployment, restartingDeployments} = useDeployments();
    const {addNotification} = useNotifications();
    const {deploymentToDelete, setDeploymentToDelete} = useDeploymentsContext();

    const handleToggle = async () => {
        const success = await toggleDeployment(deployment.name, deployment.enabled);
        if (success) {
            addNotification(`Successfully ${deployment.enabled ? 'disabled' : 'enabled'} ${deployment.name}`, 'success');
        } else {
            addNotification(`Failed to toggle ${deployment.name}`, 'danger');
        }
    };

    const handleRestart = async () => {
        const success = await restartDeployment(deployment.name);
        if (success) {
            addNotification(`Successfully restarted ${deployment.name}`, 'success');
        } else {
            addNotification(`Failed to restart ${deployment.name}`, 'danger');
        }
    };

    return (
        <div className="group relative">
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
                <div className="p-6">
                    {/* Status Indicator */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${deployment.enabled ? 'bg-green-500' : 'bg-gray-300'}`}/>
                            <span className="text-sm font-medium text-gray-500">
                                {deployment.enabled ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <motion.button
                                whileHover={{scale: 1.1}}
                                whileTap={{scale: 0.95}}
                                className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                                onClick={handleRestart}
                                disabled={restartingDeployments.has(deployment.name)}
                            >
                                {restartingDeployments.has(deployment.name) ? (
                                    <div
                                        className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"/>
                                ) : (
                                    <RotateCcw size={18}/>
                                )}
                            </motion.button>
                            <motion.button
                                whileHover={{scale: 1.1}}
                                whileTap={{scale: 0.95}}
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                onClick={() => navigate(`/files${deployment.dataDirectory}`)}
                            >
                                <Folder size={18}/>
                            </motion.button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">{deployment.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{deployment.path}</p>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                onClick={() => navigate(`/deployments/${deployment.name}/edit`)}
                            >
                <span className="flex items-center space-x-2">
                  <Edit size={16}/>
                  <span>Edit</span>
                </span>
                            </motion.button>
                            <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                onClick={() => setDeploymentToDelete(deployment.name)}
                            >
                <span className="flex items-center space-x-2">
                  <Trash size={16}/>
                  <span>Delete</span>
                </span>
                            </motion.button>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={deployment.enabled}
                                onChange={handleToggle}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer
                            peer-focus:ring-4 peer-focus:ring-blue-300
                            peer-checked:after:translate-x-full peer-checked:bg-blue-600
                            after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                            after:bg-white after:rounded-full after:h-5 after:w-5
                            after:transition-all border-2 border-transparent">
                            </div>
                        </label>
                    </div>
                </div>
            </motion.div>

            {deployment.name === deploymentToDelete && (
                <DeleteDeploymentModal
                    deploymentName={deployment.name}
                    onClose={() => setDeploymentToDelete(null)}
                />
            )}
        </div>
    );
};

export default DeploymentCard;