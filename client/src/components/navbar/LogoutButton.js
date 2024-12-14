import React from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance, { clearToken } from '../../utils/auth';

const LogoutButton = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const response = await axiosInstance.post('/api/logout');

            if (response.status === 200) {
                clearToken();
                navigate('/login');
            } else {
                console.error('logout failed');
            }
        } catch (error) {
            console.error('error:', error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
        >
            Logout
        </button>
    );
};

export default LogoutButton;