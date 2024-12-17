import React from 'react';

export const Notifications = ({ notifications, onDismiss }) => {
    if (!notifications.length) return null;

    return (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1050 }}>
            {notifications.map(({ id, message, type }) => (
                <div key={id} className={`alert alert-${type} alert-dismissible fade show`} role="alert">
                    {message}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => onDismiss(id)}
                    />
                </div>
            ))}
        </div>
    );
};