import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProxy } from '../../hooks/useProxy';
import { useNotifications } from '../../hooks/useNotifications';
import { FolderIcon, RestartIcon, EditIcon } from '../../../../components/icons/DeploymentIcons';

const ProxyCard = () => {
    const navigate = useNavigate();
    const { proxyConfig, toggleProxy, restartProxy, restartingProxy } = useProxy();
    const { addNotification } = useNotifications();

    if (!proxyConfig) {
        return (
            <div className="col-12">
                <div className="card shadow-sm border">
                    <div className="card-body text-center py-5">
                        <h5 className="card-title mb-0 text-muted">No Proxy Found</h5>
                    </div>
                </div>
            </div>
        );
    }

    const handleToggle = async () => {
        const success = await toggleProxy(proxyConfig.enabled);
        if (success) {
            addNotification('Successfully updated proxy status', 'success');
        } else {
            addNotification('Failed to toggle proxy', 'danger');
        }
    };

    const handleRestart = async () => {
        const success = await restartProxy();
        if (success) {
            addNotification('Successfully restarted proxy', 'success');
        } else {
            addNotification('Failed to restart proxy', 'danger');
        }
    };

    return (
        <div className="card">
            <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="card-title mb-1">Velocity Proxy</h5>
                    <p className="card-text text-muted small mb-0">{proxyConfig.path}</p>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <button
                        className="btn btn-outline-info btn-sm"
                        onClick={() => navigate(`/files${proxyConfig.dataDirectory}`)}
                        title="View Data Directory"
                    >
                        <FolderIcon />
                    </button>

                    <button
                        className="btn btn-outline-warning btn-sm"
                        onClick={handleRestart}
                        title="Restart Proxy"
                        disabled={restartingProxy}
                    >
                        {restartingProxy ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        ) : (
                            <RestartIcon />
                        )}
                    </button>

                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => navigate('/proxy/edit')}
                    >
                        <EditIcon />
                    </button>

                    <div className="form-check form-switch" style={{minWidth: '120px'}}>
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="proxy-toggle"
                            checked={proxyConfig.enabled}
                            onChange={handleToggle}
                        />
                        <label className="form-check-label" htmlFor="proxy-toggle">
                            {proxyConfig.enabled ? 'Enabled' : 'Disabled'}
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProxyCard;