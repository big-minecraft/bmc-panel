import React from 'react';

const InstanceDetails = ({ instance }) => {
    return (
        <div className="card mb-3">
            <div className="card-header">
                <h3>Instance Details</h3>
            </div>
            <div className="card-body">
                <p><strong>Pod Name:</strong> {instance.podName}</p>
                <p><strong>IP:</strong> {instance.ip}</p>
                <p><strong>Players:</strong> {Object.keys(instance.players).length}</p>
            </div>
        </div>
    );
};

export default InstanceDetails;