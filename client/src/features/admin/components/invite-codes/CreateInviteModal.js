import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Info } from 'lucide-react';
import Modal from '../../../../common/zold/Modal';

const CreateInviteModal = ({ show, onClose, onCreate }) => {
    const [newInviteMessage, setNewInviteMessage] = useState('');
    const [error, setError] = useState('');

    const handleCreate = () => {
        if (!newInviteMessage.trim()) {
            setError('Message cannot be empty');
            return;
        }
        onCreate(newInviteMessage);
        setNewInviteMessage('');
        setError('');
    };

    if (!show) return null;

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-gray-400" />
                    <span>Create New Invite Code</span>
                </div>
            }
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreate}
                        className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Create Code
                    </motion.button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                        This message will be shown to users when they use this invite code to register.
                    </p>
                </div>
                <div>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow min-h-[100px]"
                        placeholder="Enter invite message"
                        value={newInviteMessage}
                        onChange={(e) => {
                            setNewInviteMessage(e.target.value);
                            setError('');
                        }}
                    />
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-sm text-red-600"
                        >
                            {error}
                        </motion.p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CreateInviteModal;