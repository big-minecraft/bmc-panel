import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeployments } from '../../hooks/useDeployments';
import { useNotifications } from '../../hooks/useNotifications';
import { FolderIcon, RestartIcon, EditIcon, TrashIcon } from '../../../../components/icons/DeploymentIcons';
import DeleteDeploymentModal from "../modals/DeleteDeploymentModal";
import {useDeploymentsContext} from "../../context/DeploymentsContext";

const DeploymentCard = ({ deployment }) => {
    const navigate = useNavigate();
    const { toggleDeployment, restartDeployment, restartingDeployments } = useDeployments();
    const { addNotification } = useNotifications();
    const { deploymentToDelete, setDeploymentToDelete } = useDeploymentsContext();

    const handleToggle = async () => {
        const success = await toggleDeployment(deployment.name, deployment.enabled);
        if (success) {
            addNotification(`Successfully ${deployment.enabled ? 'disabled' : 'enabled'} ${deployment.name}`, 'success');
        } else {
            addNotification(`Failed to toggle ${deployment.name}`, 'danger');
        }
    };

    const handleRestart = async () => {
        const success = await restartDeployment(deployment.name);
        if (success) {
            addNotification(`Successfully restarted ${deployment.name}`, 'success');
        } else {
            addNotification(`Failed to restart ${deployment.name}`, 'danger');
        }
    };

    return (
        <div className="col-12">
            <div className="card">
                <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="card-title mb-1">{deployment.name}</h5>
                        <p className="card-text text-muted small mb-0">
                            {deployment.path}
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => navigate(`/files${deployment.dataDirectory}`)}
                            title="View Data Directory"
                        >
                            <FolderIcon />
                        </button>

                        <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={handleRestart}
                            title="Restart Deployment"
                            disabled={restartingDeployments.has(deployment.name)}
                        >
                            {restartingDeployments.has(deployment.name) ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            ) : (
                                <RestartIcon />
                            )}
                        </button>

                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => navigate(`/deployments/${deployment.name}/edit`)}
                        >
                            <EditIcon />
                        </button>

                        <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setDeploymentToDelete(deployment.name)}
                        >
                            <TrashIcon />
                        </button>

                        <div className="form-check form-switch" style={{ minWidth: '120px' }}>
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`deployment-toggle-${deployment.name}`}
                                checked={deployment.enabled}
                                onChange={handleToggle}
                            />
                            <label
                                className="form-check-label"
                                htmlFor={`deployment-toggle-${deployment.name}`}
                            >
                                {deployment.enabled ? 'Enabled' : 'Disabled'}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {deployment.name === deploymentToDelete && (
                <DeleteDeploymentModal
                    deploymentName={deployment.name}
                    onClose={() => setDeploymentToDelete(null)}
                />
            )}
        </div>
    );
};

export default DeploymentCard;