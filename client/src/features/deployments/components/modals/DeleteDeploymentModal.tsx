import {motion} from 'framer-motion';
import {X, AlertTriangle} from 'lucide-react';
import {useDeployments} from '../../hooks/useDeployments';
import {useNotifications} from '../../hooks/useNotifications';
import {useDeploymentsContext} from '../../context/DeploymentsContext';

const DeleteDeploymentModal = ({deploymentName, onClose}) => {
    const {deleteDeployment} = useDeployments();
    const {addNotification} = useNotifications();
    const {setDeploymentToDelete} = useDeploymentsContext();

    if (!deploymentName) return null;

    const handleDelete = async () => {
        const success = await deleteDeployment(deploymentName);
        if (success) {
            addNotification(`Successfully deleted ${deploymentName}`, 'success');
            setDeploymentToDelete(null);
        } else {
            addNotification(`Failed to delete ${deploymentName}`, 'danger');
        }
    };

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{scale: 0.95, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                exit={{scale: 0.95, opacity: 0}}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-6 h-6 text-red-500"/>
                        <h3 className="text-xl font-semibold text-gray-900">Delete Deployment</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-500"/>
                        </div>
                        <div>
                            <p className="text-gray-600">
                                Are you sure you want to delete the deployment <span
                                className="font-semibold">"{deploymentName}"</span>?
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-6 flex justify-end space-x-3">
                    <motion.button
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        className="px-4 py-2 text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200
                     rounded-lg transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        className="px-4 py-2 text-white bg-red-500 hover:bg-red-600
                     rounded-lg transition-colors flex items-center space-x-2"
                        onClick={handleDelete}
                    >
                        <span>Delete Deployment</span>
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DeleteDeploymentModal;