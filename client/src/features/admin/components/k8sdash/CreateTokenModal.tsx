import React from 'react';
import {motion} from 'framer-motion';
import {AlertTriangle} from 'lucide-react';
import Modal from '../../../../common/zold/Modal';
import {li} from 'framer-motion/client';

const CreateTokenModal = ({show, onClose, onCreate}) => {
    if (!show) return null;

    return (
        <Modal
            title="Create K8s Dashboard Token"
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-2">
                    <motion.button
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        onClick={onCreate}
                        className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Create Token
                    </motion.button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="bg-amber-50 rounded-lg p-4 space-y-3">
                    <div className="flex gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
                        <p className="text-sm font-medium text-amber-800">
                            Important Security Notice
                        </p>
                    </div>
                    <div className="text-sm text-amber-700 space-y-2">
                        <p>
                            This token grants full administrative access to the Kubernetes dashboard. With this token,
                            users can:
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>View all cluster resources and configurations</li>
                            <li>Deploy and modify workloads</li>
                            <li>Access sensitive configuration data</li>
                            <li>View logs and execute commands in containers</li>
                        </ul>
                        <p>
                            Only create this token when necessary and ensure it's shared securely with authorized users.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CreateTokenModal;