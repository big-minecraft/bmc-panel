import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAdmin } from '../../../utils/auth';

const NavLink = ({ to, children, requireAdmin = false }) => {
    const location = useLocation();
    const userIsAdmin = isAdmin();

    if (requireAdmin && !userIsAdmin) {
        return null;
    }

    const isActivePath = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const isActive = isActivePath(to);

    return (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
                to={to}
                className={`relative no-underline px-4 py-2 text-sm font-medium rounded-lg
                           transition-all duration-200 ${
                    isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
                {children}
                {isActive && (
                    <motion.div
                        layoutId="navbar-indicator"
                        className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
            </Link>
        </motion.div>
    );
};

export default NavLink;