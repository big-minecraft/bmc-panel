import {useState} from 'react';
import {motion} from 'framer-motion';
import {X, Server, AlertCircle} from 'lucide-react';
import {useDeployments} from '../../hooks/useDeployments';
import {useNotifications} from '../../hooks/useNotifications';
import {useDeploymentsContext} from '../../context/DeploymentsContext';

const CreateDeploymentModal = ({show, onClose}) => {
    const [deploymentName, setDeploymentName] = useState('');
    const [deploymentType, setDeploymentType] = useState('');
    const [error, setError] = useState(null);

    const {createDeployment} = useDeployments();
    const {addNotification} = useNotifications();
    const {nodes, isLoadingNodes, selectedNode, setSelectedNode} = useDeploymentsContext();

    const handleCreate = async () => {
        if (!deploymentName.trim()) {
            setError('Deployment name is required');
            return;
        }

        if (deploymentType === 'persistent' && !selectedNode) {
            setError('Please select a node for the persistent deployment');
            return;
        }

        const success = await createDeployment({
            name: deploymentName,
            type: deploymentType,
            node: (deploymentType === 'persistent' ? selectedNode : undefined)
        });

        if (success) {
            addNotification(`Successfully created ${deploymentName}`, 'success');
            handleClose();
        } else {
            setError('Failed to create deployment');
        }
    };

    const handleClose = () => {
        setDeploymentName('');
        setDeploymentType('');
        setSelectedNode('');
        setError(null);
        onClose();
    };

    if (!show) return null;

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
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
                        <Server className="w-6 h-6 text-blue-500"/>
                        <h3 className="text-xl font-semibold text-gray-900">Create New Deployment</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {error && (
                        <motion.div
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-start space-x-2"
                        >
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0"/>
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Deployment Name
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2
                       focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            placeholder="Enter deployment name"
                            value={deploymentName}
                            onChange={(e) => setDeploymentName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Deployment Type
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all
                          ${deploymentType === 'persistent'
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-gray-200 hover:border-gray-300'}`}
                                onClick={() => setDeploymentType('persistent')}
                            >
                                <Server className="w-6 h-6"/>
                                <span className="font-medium">Persistent</span>
                            </button>
                            <button
                                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all
                          ${deploymentType === 'scalable'
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-gray-200 hover:border-gray-300'}`}
                                onClick={() => setDeploymentType('scalable')}
                            >
                                <Server className="w-6 h-6"/>
                                <span className="font-medium">Scalable</span>
                            </button>
                            <button
                                className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all
                          ${deploymentType === 'process'
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-gray-200 hover:border-gray-300'}`}
                                onClick={() => setDeploymentType('process')}
                            >
                                <Server className="w-6 h-6"/>
                                <span className="font-medium">Process</span>
                            </button>
                        </div>
                    </div>

                    {deploymentType === 'persistent' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Select Node
                            </label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2
                         focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={selectedNode}
                                onChange={(e) => setSelectedNode(e.target.value)}
                                disabled={isLoadingNodes}
                            >
                                <option value="">Choose a node</option>
                                {nodes.map((nodeName) => (
                                    <option key={nodeName} value={nodeName}>
                                        {nodeName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-6 flex justify-end space-x-3">
                    <motion.button
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        className="px-4 py-2 text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200
                     rounded-lg transition-colors"
                        onClick={handleClose}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600
                     rounded-lg transition-colors flex items-center space-x-2"
                        onClick={handleCreate}
                    >
                        <span>Create Deployment</span>
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CreateDeploymentModal;