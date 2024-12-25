import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {Eye, EyeOff, Key} from 'lucide-react';
import Modal from '../../../../common/zold/Modal';

const ResetPasswordModal = ({user, onClose, onReset}) => {
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!newPassword.trim()) {
            setError('Password cannot be empty');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        onReset(newPassword);
        setNewPassword('');
        setError('');
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-gray-400"/>
                    <span>Reset Password for {user?.username}</span>
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
                        onClick={handleSubmit}
                        className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Reset Password
                    </motion.button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            setError('');
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                </div>
                {error && (
                    <motion.p
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        className="text-sm text-red-600"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        </Modal>
    );
};

export default ResetPasswordModal;