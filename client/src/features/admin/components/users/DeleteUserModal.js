import React from 'react';
import { motion } from 'framer-motion';
import Modal from '../../../../common/zold/Modal';

const DeleteUserModal = ({ user, onClose, onDelete }) => {
    return (
        <Modal
            title="Confirm Delete"
            onClose={onClose}
            footer={
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onDelete}
                        className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                        Delete
                    </motion.button>
                </div>
            }
        >
            <p className="text-gray-700">
                Are you sure you want to delete the user "{user?.username}"?
            </p>
        </Modal>
    );
};

export default DeleteUserModal;