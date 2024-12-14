import React from 'react';
import { Trash } from 'lucide-react';

const UserCard = ({ user, onToggleAdmin, onResetPassword, onDeleteUser }) => {
    return (
        <div className="card">
            <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="card-title mb-1">
                        {user.username}
                        {Boolean(user.is_admin) && (
                            <span className="badge bg-primary ms-2">Admin</span>
                        )}
                    </h5>
                    <p className="card-text text-muted small mb-0">
                        User ID: {user.id}
                    </p>
                </div>

                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => onResetPassword(user)}
                    >
                        Reset Password
                    </button>
                    <button
                        className={`btn btn-outline-${user.is_admin ? 'warning' : 'success'} btn-sm`}
                        onClick={() => onToggleAdmin(user.id, user.is_admin)}
                    >
                        {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                    <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => onDeleteUser(user)}
                    >
                        <Trash size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserCard;