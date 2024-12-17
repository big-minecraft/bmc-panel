import React from 'react';
import { AlertTriangleIcon } from '../icons/AuthIcons';

export const Alert = ({ message }) => (
    <div className="alert alert-danger d-flex align-items-center" role="alert">
        <AlertTriangleIcon />
        <div>{message}</div>
    </div>
);