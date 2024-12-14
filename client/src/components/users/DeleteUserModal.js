import React from 'react';
import Modal from '../common/Modal';

const DeleteUserModal = ({ user, onClose, onDelete }) => {
    return (
        <Modal
            title="Confirm Delete"
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
                        className="btn btn-danger"
                        onClick={onDelete}
                    >
                        Delete
                    </button>
                </>
            }
        >
            Are you sure you want to delete the user "{user?.username}"?
        </Modal>
    );
};

export default DeleteUserModal;