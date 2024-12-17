import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/loginPage';
import RegistrationPage from '../pages/registrationPage';
import Deployments from '../features/deployments/pages/Deployments';
import Admin from '../pages/Admin';
import InstancePage from '../pages/instancePage';
import NotFound from '../pages/NotFound';
import PrivateRoute from './PrivateRoute';
import SftpInterface from '../features/sftp/pages/SFTPInterface';
import EditDeployments from "../features/deployments/pages/EditDeployments";
import Databases from "../features/databases/pages/Databases";

const AppRoutes = ({ instances, proxies }) => (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/" element={<PrivateRoute><HomePage instances={instances} proxies={proxies} /></PrivateRoute>} />
        <Route path="/deployments" element={<PrivateRoute><Deployments /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/files/*" element={<PrivateRoute><SftpInterface /></PrivateRoute>} />
        <Route path="/databases" element={<PrivateRoute><Databases /></PrivateRoute>} />
        <Route path="/deployments/:name/edit" element={<PrivateRoute><EditDeployments /></PrivateRoute>} />
        <Route path="/proxy/edit" element={<PrivateRoute><EditDeployments /></PrivateRoute>} />
        <Route path="/instance/:instanceName" element={<PrivateRoute><InstancePage instances={instances} proxies={proxies} /></PrivateRoute>} />
        <Route path="/proxy/:instanceName" element={<PrivateRoute><InstancePage instances={instances} proxies={proxies} /></PrivateRoute>} />
        <Route path="*" element={<PrivateRoute><NotFound /></PrivateRoute>} />
    </Routes>
);

export default AppRoutes;