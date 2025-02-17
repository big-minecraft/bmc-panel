import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import {Folder, RotateCcw, Edit, Server} from 'lucide-react';
import {useProxy} from '../../hooks/useProxy';
import {useNotifications} from '../../hooks/useNotifications';

const ProxyCard = () => {
    const navigate = useNavigate();
    const {proxyConfig, toggleProxy, restartProxy, restartingProxy} = useProxy();
    const {addNotification} = useNotifications();

    if (!proxyConfig) {
        return (
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                className="bg-white rounded-2xl border border-gray-100 p-8 text-center"
            >
                <Server className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                <h5 className="text-lg font-medium text-gray-500">No Proxy Configuration Found</h5>
            </motion.div>
        );
    }

    const handleToggle = async () => {
        const success = await toggleProxy(proxyConfig.enabled);
        if (success) {
            addNotification('Successfully updated proxy status', 'success');
        } else {
            addNotification('Failed to toggle proxy', 'danger');
        }
    };

    const handleRestart = async () => {
        const success = await restartProxy();
        if (success) {
            addNotification('Successfully restarted proxy', 'success');
        } else {
            addNotification('Failed to restart proxy', 'danger');
        }
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm"
        >
            <div className="p-6">
                {/* Status Bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <div
                            className={`w-3 h-3 rounded-full ${proxyConfig.enabled ? 'bg-green-500' : 'bg-gray-300'}`}/>
                        <span className="text-sm font-medium text-gray-500">
              {proxyConfig.enabled ? 'Active' : 'Inactive'}
            </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <motion.button
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.95}}
                            className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                            onClick={handleRestart}
                            disabled={restartingProxy}
                        >
                            {restartingProxy ? (
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
                            onClick={() => navigate(`/files${proxyConfig.dataDirectory}`)}
                        >
                            <Folder size={18}/>
                        </motion.button>
                    </div>
                </div>

                {/* Main Content */}
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Velocity Proxy</h3>
                    <p className="text-sm text-gray-500 mt-1">{proxyConfig.path}</p>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6">
                    <motion.button
                        whileHover={{scale: 1.05}}
                        whileTap={{scale: 0.95}}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                        onClick={() => navigate('/proxy/edit')}
                    >
                        <span className="flex items-center space-x-2">
                            <Edit size={16}/>
                            <span>Edit Configuration</span>
                        </span>
                    </motion.button>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={proxyConfig.enabled}
                            onChange={handleToggle}
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer
                          peer-focus:ring-4 peer-focus:ring-indigo-300
                          peer-checked:after:translate-x-full peer-checked:bg-indigo-600
                          after:content-[''] after:absolute after:top-0.5 after:left-[2px]
                          after:bg-white after:rounded-full after:h-5 after:w-5
                          after:transition-all border-2 border-transparent">
                        </div>
                    </label>
                </div>
            </div>
        </motion.div>
    );
};

export default ProxyCard;