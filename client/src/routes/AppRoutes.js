import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NetworkOverview from '../features/overview/pages/NetworkOverview.js';
import Deployments from '../features/deployments/pages/Deployments.js';
import Admin from '../features/admin/pages/Admin.js';
import ServerInstance from '../features/overview/pages/ServerInstance.js';
import NotFound from '../common/pages/NotFound';
import PrivateRoute from './PrivateRoute';
import SftpInterface from '../features/sftp/pages/SFTPInterface.js';
import EditDeployments from "../features/deployments/pages/EditDeployments.js";
import Databases from "../features/databases/pages/Databases.js";
import Login from "../features/auth/pages/Login.js";
import Registration from "../features/auth/pages/Registration.js";

const AppRoutes = ({ instances, proxies }) => (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/" element={<PrivateRoute><NetworkOverview instances={instances} proxies={proxies} /></PrivateRoute>} />
        <Route path="/deployments" element={<PrivateRoute><Deployments /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/files/*" element={<PrivateRoute><SftpInterface /></PrivateRoute>} />
        <Route path="/databases" element={<PrivateRoute><Databases /></PrivateRoute>} />
        <Route path="/deployments/:name/edit" element={<PrivateRoute><EditDeployments /></PrivateRoute>} />
        <Route path="/proxy/edit" element={<PrivateRoute><EditDeployments /></PrivateRoute>} />
        <Route path="/instance/:instanceName" element={<PrivateRoute><ServerInstance instances={instances} proxies={proxies} /></PrivateRoute>} />
        <Route path="/proxy/:instanceName" element={<PrivateRoute><ServerInstance instances={instances} proxies={proxies} /></PrivateRoute>} />
        <Route path="*" element={<PrivateRoute><NotFound /></PrivateRoute>} />
    </Routes>
);

export default AppRoutes;