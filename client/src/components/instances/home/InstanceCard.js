import React from 'react';
import { Link } from 'react-router-dom';
import UserIcon from '../../icons/UserIcon';

const InstanceCard = ({ instance, linkPrefix = "/instance" }) => (
    <Link to={`${linkPrefix}/${instance.name}`} state={{ instance }} className="text-decoration-none">
        <div className="card mb-3">
            <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="card-title mb-1">{instance.name}</h5>
                    {instance.description && (
                        <p className="card-text text-muted small mb-0">{instance.description}</p>
                    )}
                </div>
                <div className="d-flex align-items-center">
                    <span className="ml-2">
                        {Object.keys(instance.players).length}
                    </span>
                    <UserIcon />
                </div>
            </div>
        </div>
    </Link>
);

export default InstanceCard;