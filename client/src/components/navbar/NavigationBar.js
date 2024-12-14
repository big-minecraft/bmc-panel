import React from 'react';
import { useLocation } from 'react-router-dom';
import NavLink from './NavLink';
import LogoutButton from './LogoutButton';

const NavigationBar = () => {
    const location = useLocation();
    const hideNavbarRoutes = ['/login', '/register'];

    if (hideNavbarRoutes.includes(location.pathname)) {
        return null;
    }

    return (
        <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <NavLink to="/">Big Minecraft</NavLink>
                        <NavLink to="/gamemodes">Gamemodes</NavLink>
                        <NavLink to="/files">Files</NavLink>
                        <NavLink to="/databases">Databases</NavLink>
                    </div>
                    <div className="flex items-center space-x-4">
                        <NavLink to="/admin" requireAdmin>Admin</NavLink>
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;