import {motion} from 'framer-motion';
import {AlertTriangle} from 'lucide-react';
import Modal from '../../../../common/zold/Modal';

const RevokeInviteModal = ({code, onClose, onRevoke}) => {
    if (!code) return null;

    return (
        <Modal
            title={
                <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5"/>
                    <span>Confirm Revoke</span>
                </div>
            }
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
                        onClick={() => onRevoke(code)}
                        className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Revoke Code
                    </motion.button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                        Are you sure you want to revoke this invite code? This action cannot be undone.
                    </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-mono text-gray-600">
                        {code}
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default RevokeInviteModal;