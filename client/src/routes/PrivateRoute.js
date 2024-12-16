import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../utils/auth';

const PrivateRoute = ({ children }) => {
    let isLoggedIn = false;
    const token = getToken();

    if (token) {
        try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const currentTime = new Date().getTime() / 1000;
            if (tokenData.exp > currentTime) {
                isLoggedIn = true;
            }
        } catch (error) {
            console.error('Failed to decode token:', error);
        }
    }

    const location = useLocation();

    return isLoggedIn ? (
        <>{children}</>
    ) : (
        <Navigate
            replace={true}
            to="/login"
            state={{ from: `${location.pathname}${location.search}` }}
        />
    );
};

export default PrivateRoute;