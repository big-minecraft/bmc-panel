import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isAdmin } from '../../utils/auth';

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

    return (
        <Link
            to={to}
            className={`no-underline px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActivePath(to)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
            {children}
        </Link>
    );
};

export default NavLink;