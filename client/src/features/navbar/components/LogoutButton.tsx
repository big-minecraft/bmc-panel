import React from 'react';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {LogOut} from 'lucide-react';
import axiosInstance, {clearToken} from '../../../utils/auth';

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
        <motion.button
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.98}}
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700
                     hover:bg-red-50 rounded-lg transition-colors inline-flex items-center space-x-2"
        >
            <LogOut className="w-4 h-4"/>
            <span>Logout</span>
        </motion.button>
    );
};

export default LogoutButton;