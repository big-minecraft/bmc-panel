import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '../utils/auth';

const NavigationBar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearToken();
        navigate('/login');
    };

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
            <button
                onClick={handleLogout}
                className="btn btn-outline-danger"
            >
                Logout
            </button>
        </div>
    );
};

export default NavigationBar;