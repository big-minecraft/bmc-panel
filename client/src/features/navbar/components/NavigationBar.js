import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import NavLink from './NavLink';
import LogoutButton from './LogoutButton.js';

const NavigationBar = () => {
    const location = useLocation();
    const hideNavbarRoutes = ['/login', '/register'];

    if (hideNavbarRoutes.includes(location.pathname)) {
        return null;
    }

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 backdrop-blur-lg bg-white/80"
        >
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-2">
                        <NavLink to="/">Overview</NavLink>
                        <NavLink to="/deployments">Deployments</NavLink>
                        <NavLink to="/files">Files</NavLink>
                        <NavLink to="/databases">Databases</NavLink>
                    </div>
                    <div className="flex items-center space-x-2">
                        <NavLink to="/admin" requireAdmin>Admin</NavLink>
                        <div className="w-px h-6 bg-gray-200 mx-2" />
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default NavigationBar;