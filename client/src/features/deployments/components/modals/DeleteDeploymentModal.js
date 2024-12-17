import React from 'react';
import { useDeployments } from '../../hooks/useDeployments';
import { useNotifications } from '../../hooks/useNotifications';

const DeleteDeploymentModal = ({ deploymentName, onClose }) => {
    const { deleteDeployment } = useDeployments();
    const { addNotification } = useNotifications();

    if (!deploymentName) return null;

    const handleDelete = async () => {
        const success = await deleteDeployment(deploymentName);
        if (success) {
            addNotification(`Successfully deleted ${deploymentName}`, 'success');
            onClose();
        } else {
            addNotification(`Failed to delete ${deploymentName}`, 'danger');
        }
    };

    return (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Confirm Delete</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        Are you sure you want to delete the deployment "{deploymentName}"?
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteDeploymentModal;