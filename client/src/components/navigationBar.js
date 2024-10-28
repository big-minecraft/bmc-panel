import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance, { clearToken, isAdmin } from '../utils/auth';

const NavigationBar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const userIsAdmin = isAdmin();

    const handleLogout = async () => {
        try {
            const response = await axiosInstance.post('/api/logout');

            if (response.status === 200) {
                clearToken();
                navigate('/login');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const hideNavbarRoutes = ['/login', '/register'];

    if (hideNavbarRoutes.includes(location.pathname)) {
        return null;
    }

    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex gap-2">
                <Link
                    to="/"
                    className="btn"
                    style={{ backgroundColor: 'white', border: '1px solid black', color: 'black' }}
                >
                    Big Minecraft
                </Link>
                <Link
                    to="/gamemodes"
                    className="btn"
                    style={{ backgroundColor: 'white', border: '1px solid black', color: 'black' }}
                >
                    Gamemodes
                </Link>
            </div>

            <div className="d-flex gap-2">
                {userIsAdmin && (
                    <Link
                        to="/users"
                        className="btn"
                        style={{ backgroundColor: 'white', border: '1px solid black', color: 'black' }}
                    >
                        Users
                    </Link>
                )}
                <button
                    onClick={handleLogout}
                    className="btn btn-outline-danger"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default NavigationBar;
