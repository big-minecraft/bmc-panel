import {Routes, Route} from 'react-router-dom';
import NetworkOverview from '../features/overview/pages/NetworkOverview';
import Deployments from '../features/deployments/pages/Deployments';
import Admin from '../features/admin/pages/Admin';
import ServerInstance from '../features/overview/pages/ServerInstance';
import NotFound from '../common/pages/NotFound';
import PrivateRoute from './PrivateRoute';
import FilesPage from '../features/files/pages/FilesPage';
import FilesInterface from '../features/files/pages/FilesInterface';
import SessionPage from '../features/files/pages/SessionPage';
import EditDeployments from "../features/deployments/pages/EditDeployments";
import Databases from "../features/databases/pages/Databases";
import Login from "../features/auth/pages/Login";
import Registration from "../features/auth/pages/Registration";

const AppRoutes = () => (
    <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Registration/>}/>
        <Route path="/"
               element={<PrivateRoute><NetworkOverview/></PrivateRoute>}/>
        <Route path="/deployments" element={<PrivateRoute><Deployments/></PrivateRoute>}/>
        <Route path="/admin" element={<PrivateRoute><Admin/></PrivateRoute>}/>
        <Route path="/files" element={<PrivateRoute><FilesPage/></PrivateRoute>}/>
        <Route path="/files/session/:deploymentName" element={<PrivateRoute><SessionPage/></PrivateRoute>}/>
        <Route path="/files/:deploymentName/*" element={<PrivateRoute><FilesInterface/></PrivateRoute>}/>
        <Route path="/databases" element={<PrivateRoute><Databases/></PrivateRoute>}/>
        <Route path="/deployments/:name/edit" element={<PrivateRoute><EditDeployments/></PrivateRoute>}/>
        <Route path="/instance/:deploymentName/:instanceUid"
               element={<PrivateRoute><ServerInstance/></PrivateRoute>}/>
        <Route path="*" element={<PrivateRoute><NotFound/></PrivateRoute>}/>
    </Routes>
);

export default AppRoutes;