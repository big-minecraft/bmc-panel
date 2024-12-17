import React, { useState } from 'react';
import { useDeployments } from '../../hooks/useDeployments';
import { useNotifications } from '../../hooks/useNotifications';
import { useDeploymentsContext } from '../../context/DeploymentsContext';

const CreateDeploymentModal = ({ show, onClose }) => {
    const [deploymentName, setDeploymentName] = useState('');
    const [deploymentType, setDeploymentType] = useState('');
    const [error, setError] = useState(null);

    const { createDeployment } = useDeployments();
    const { addNotification } = useNotifications();
    const { nodes, isLoadingNodes, selectedNode, setSelectedNode } = useDeploymentsContext();

    if (!show) return null;

    const handleCreate = async () => {
        if (!deploymentName.trim()) {
            setError('Deployment name is required');
            return;
        }

        if (deploymentType === 'persistent' && !selectedNode) {
            setError('Please select a node for the persistent deployment');
            return;
        }

        const success = await createDeployment({
            name: deploymentName,
            type: deploymentType,
            node: (deploymentType === 'persistent' ? selectedNode : undefined)
        });

        if (success) {
            addNotification(`Successfully created ${deploymentName}`, 'success');
            setDeploymentName('');
            setDeploymentType('');
            setSelectedNode('');
            setError(null);
            onClose();
        } else {
            setError('Failed to create deployment');
        }
    };

    return (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Create New Deployment</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger mb-3" role="alert">
                                {error}
                            </div>
                        )}

                        <div className="mb-3">
                            <label htmlFor="deploymentName" className="form-label">Deployment Name</label>
                            <input
                                id="deploymentName"
                                type="text"
                                className="form-control"
                                placeholder="Enter deployment name"
                                value={deploymentName}
                                onChange={(e) => setDeploymentName(e.target.value)}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label d-block">Deployment Type</label>
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="deploymentType"
                                    id="persistentType"
                                    value="persistent"
                                    checked={deploymentType === 'persistent'}
                                    onChange={(e) => setDeploymentType(e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="persistentType">
                                    Persistent
                                </label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="deploymentType"
                                    id="nonPersistentType"
                                    value="non-persistent"
                                    checked={deploymentType === 'non-persistent'}
                                    onChange={(e) => setDeploymentType(e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="nonPersistentType">
                                    Non-Persistent
                                </label>
                            </div>
                        </div>

                        {deploymentType === 'persistent' && (
                            <div className="mb-3">
                                <label htmlFor="nodeSelection" className="form-label">Select Node</label>
                                <select
                                    id="nodeSelection"
                                    className="form-select"
                                    value={selectedNode}
                                    onChange={(e) => setSelectedNode(e.target.value)}
                                    disabled={isLoadingNodes}
                                >
                                    <option value="">Choose a node</option>
                                    {nodes.map((nodeName) => (
                                        <option key={nodeName} value={nodeName}>
                                            {nodeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleCreate}>Create</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateDeploymentModal;