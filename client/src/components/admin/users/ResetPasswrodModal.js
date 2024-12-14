import React, { useState } from 'react';
import Modal from '../../common/Modal';

const ResetPasswordModal = ({ user, onClose, onReset }) => {
    const [newPassword, setNewPassword] = useState('');

    const handleSubmit = () => {
        if (!newPassword.trim()) return;
        onReset(newPassword);
        setNewPassword('');
    };

    return (
        <Modal
            title={`Reset Password for ${user?.username}`}
            onClose={onClose}
            footer={
                <>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                    >
                        Reset Password
                    </button>
                </>
            }
        >
            <input
                type="password"
                className="form-control"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
        </Modal>
    );
};

export default ResetPasswordModal;