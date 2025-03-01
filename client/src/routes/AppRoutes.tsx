import {Routes, Route} from 'react-router-dom';
import NetworkOverview from '../features/overview/pages/NetworkOverview';
import Deployments from '../features/deployments/pages/Deployments';
import Admin from '../features/admin/pages/Admin';
import ServerInstance from '../features/overview/pages/ServerInstance';
import NotFound from '../common/pages/NotFound';
import PrivateRoute from './PrivateRoute';
import SftpInterface from '../features/sftp/pages/SFTPInterface';
import EditDeployments from "../features/deployments/pages/EditDeployments";
import Databases from "../features/databases/pages/Databases";
import Login from "../features/auth/pages/Login";
import Registration from "../features/auth/pages/Registration";
import Backups from "../features/backups/pages/Backups.tsx";

const AppRoutes = () => (
    <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Registration/>}/>
        <Route path="/"
               element={<PrivateRoute><NetworkOverview/></PrivateRoute>}/>
        <Route path="/deployments" element={<PrivateRoute><Deployments/></PrivateRoute>}/>
        <Route path="/admin" element={<PrivateRoute><Admin/></PrivateRoute>}/>
        <Route path="/backups" element={<PrivateRoute><Backups/></PrivateRoute>}/>
        <Route path="/files/*" element={<PrivateRoute><SftpInterface/></PrivateRoute>}/>
        <Route path="/databases" element={<PrivateRoute><Databases/></PrivateRoute>}/>
        <Route path="/deployments/:name/edit" element={<PrivateRoute><EditDeployments/></PrivateRoute>}/>
        <Route path="/instance/:deploymentName/:instanceUid"
               element={<PrivateRoute><ServerInstance/></PrivateRoute>}/>
        <Route path="*" element={<PrivateRoute><NotFound/></PrivateRoute>}/>
    </Routes>
);

export default AppRoutes;