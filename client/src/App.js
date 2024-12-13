import React, {useLayoutEffect, useState, useRef, useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { InstancePage } from './pages/instancePage';
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import GamemodesPage from "./pages/gamemodesPage";
import RegistrationPage from "./pages/registrationPage";
import LoginPage from "./pages/loginPage";
import PrivateRoute from "./components/privateRouter";
import NavigationBar from "./components/navigationBar";
import axiosInstance from "./utils/auth";
import AdminPage from "./pages/adminPage";
import SftpInterface from "./pages/sftpInterface";
import ConfigEditPage from "./pages/configEditPage";
import NotFoundPage from "./pages/notFoundPage";
import DatabasesPage from "./pages/databasesPage";
import PodCPUChart from "./components/podCPUChart";
import PodMemoryChart from "./components/podMemoryChart";

function App() {
    const [instances, setInstances] = useState([]);
    const [proxies, setProxies] = useState([]);
    const ref = useRef(null);

    useLayoutEffect(() => {
        axiosInstance.get('/api/instances')
            .then(res => {
                setInstances(res.data);
            })
            .catch(err => {
                console.error(err);
            });

        axiosInstance.get('/api/proxies')
            .then(res => {
                setProxies(res.data);
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    return (
        <Router>
            <div ref={ref} className="min-vh-100 bg-light p-4">
                <NavigationBar />
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegistrationPage />} />
                    <Route path="/" element={<HomePage instances={instances} proxies={proxies} />} />
                    <Route path="/gamemodes" element={<GamemodesPage />} />
                    <Route path="/users" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
                    <Route path="/files/*" element={<PrivateRoute><SftpInterface /></PrivateRoute>} />
                    <Route path="/databases" element={<PrivateRoute><DatabasesPage /></PrivateRoute>} />

                    <Route path="/gamemodes/:name/edit" element={<PrivateRoute><ConfigEditPage /></PrivateRoute>} />
                    <Route path="/proxy/edit" element={<PrivateRoute><ConfigEditPage /></PrivateRoute>} />

                    <Route path="/instance/:instanceName" element={<PrivateRoute><InstancePage instances={instances} proxies={proxies} /></PrivateRoute>} />
                    <Route path="/proxy/:instanceName" element={<PrivateRoute><InstancePage instances={instances} proxies={proxies} /></PrivateRoute>} />

                    <Route path="*" element={<PrivateRoute><NotFoundPage /></PrivateRoute>} />
                </Routes>
            </div>
        </Router>
    );
}

const HomePage = ({ instances: initialInstances, proxies: initialProxies }) => {
    const [instances, setInstances] = useState(initialInstances);
    const [proxies, setProxies] = useState(initialProxies);
    const location = useLocation();

    useEffect(() => {
        setInstances(initialInstances);
        setProxies(initialProxies);
    }, [initialInstances, initialProxies]);

    const fetchData = async () => {
        try {
            const [instancesRes, proxiesRes] = await Promise.all([
                axiosInstance.get('/api/instances'),
                axiosInstance.get('/api/proxies')
            ]);

            setInstances(instancesRes.data);
            setProxies(proxiesRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const intervalId = setInterval(fetchData, 3000);
        return () => clearInterval(intervalId);
    }, []);

    const userIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 9a5 5 0 0 0-5 5v1h10v-1a5 5 0 0 0-5-5z"/>
        </svg>
    );

    const instancesByGamemode = instances.reduce((acc, instance) => {
        const gamemode = instance.gamemode || 'Unknown';
        if (!acc[gamemode]) {
            acc[gamemode] = [];
        }
        acc[gamemode].push(instance);
        return acc;
    }, {});

    const sortedGamemodes = Object.keys(instancesByGamemode).sort();

    return (
        <div className="container">
            <h1 className="display-4 text-center mb-4">Instance Manager</h1>

            <div className="card mb-3"> {/* Added this wrapper div */}
                <div className="card-header">
                    <h3>CPU Usage</h3>
                </div>
                <div className="card-body">
                    <PodCPUChart podName={"survival-7ddc7c659d-trhn4"}/>
                </div>
            </div>

            <div className="card mb-3"> {/* Added this wrapper div */}
                <div className="card-header">
                    <h3>Memory Usage</h3>
                </div>
                <div className="card-body">
                    <PodMemoryChart podName={"survival-7ddc7c659d-trhn4"}/>
                </div>
            </div>


            <div className="row g-4 mb-4">
                <div className="col-12">
                    <h2 className="h5 mb-3">Proxies</h2>
                    {proxies.map((proxy, index) => (
                        <Link key={index} to={`/proxy/${proxy.name}`} state={{proxy}} className="text-decoration-none">
                            <div className="card mb-3">
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="card-title mb-1">{proxy.name}</h5>
                                        {proxy.description && (
                                            <p className="card-text text-muted small mb-0">{proxy.description}</p>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center">
                                        {userIcon}
                                        <span className="ml-2">
                                             {Object.keys(proxy.players).length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="row g-4">
                {sortedGamemodes.map((gamemode) => (
                    <div key={gamemode} className="col-12">
                        <h2 className="h5 mb-3">{gamemode.charAt(0).toUpperCase() + gamemode.slice(1)}</h2>
                        {instancesByGamemode[gamemode].map((instance, index) => (
                            <Link key={index} to={`/instance/${instance.name}`} state={{instance}}
                                  className="text-decoration-none">
                                <div className="card mb-3">
                                    <div className="card-body d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="card-title mb-1">{instance.name}</h5>
                                            {instance.description && (
                                                <p className="card-text text-muted small mb-0">{instance.description}</p>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {userIcon}
                                            <span className="ml-2">
                                             {Object.keys(instance.players).length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;