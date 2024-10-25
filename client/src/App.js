import React, { useLayoutEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { InstancePage } from './pages/instancePage';
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import GamemodesPage from "./pages/gamemodesPage";
import GamemodeEditPage from "./pages/gamemodeEditPage";

function App() {
    const [instances, setInstances] = useState([]);
    const [proxies, setProxies] = useState([]);
    const ref = useRef(null);

    useLayoutEffect(() => {
        axios.get('/api/instances')
            .then(res => {
                setInstances(res.data);
            })
            .catch(err => {
                console.error(err);
            });

        axios.get('/api/proxies')
            .then(res => {
                setProxies(res.data);
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    return (
        <Router>
            <AppContent instances={instances} proxies={proxies} ref={ref} />
        </Router>
    );
}

const AppContent = React.forwardRef(({ instances, proxies }, ref) => {
    const location = useLocation();

    const userIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 9a5 5 0 0 0-5 5v1h10v-1a5 5 0 0 0-5-5z"/>
        </svg>
    );

    // Group instances by gamemode
    const instancesByGamemode = instances.reduce((acc, instance) => {
        const gamemode = instance.gamemode || 'Unknown';
        if (!acc[gamemode]) {
            acc[gamemode] = [];
        }
        acc[gamemode].push(instance);
        return acc;
    }, {});

    // Sort gamemodes alphabetically
    const sortedGamemodes = Object.keys(instancesByGamemode).sort();

    return (
        <div ref={ref} className="min-vh-100 bg-light p-4">
            <div className="d-flex justify-content-start gap-2 mb-4">
                <Link to="/" className="btn" style={{ backgroundColor: 'white', border: '1px solid black', color: 'black' }} onClick={() => {
                    window.location.href = '/';
                }}>Big Minecraft</Link>                <Link to="/gamemodes" className="btn" style={{ backgroundColor: 'white', border: '1px solid black', color: 'black' }}>Gamemodes</Link>
            </div>
            {location.pathname === '/' && (
                <div className="container">
                    <h1 className="display-4 text-center mb-4">
                        Instance Manager
                    </h1>

                    <div className="row g-4 mb-4">
                        <div className="col-12">
                            <h2 className="h5 mb-3">Proxies</h2>
                            {proxies.map((proxy, index) => (
                                <Link
                                    key={index}
                                    to={`/proxy/${proxy.name}`}
                                    state={{ proxy }}
                                    className="text-decoration-none"
                                >
                                    <div className="card mb-3">
                                        <div className="card-body d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="card-title mb-1">{proxy.name}</h5>
                                                {proxy.description && (
                                                    <p className="card-text text-muted small mb-0">
                                                        {proxy.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center">
                                                {userIcon}
                                                <span className="ms-2">{proxy.players.length}</span>
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
                                <h2 className="h5 mb-3">
                                    {gamemode.charAt(0).toUpperCase() + gamemode.slice(1)}
                                </h2>
                                {instancesByGamemode[gamemode].map((instance, index) => (
                                    <Link
                                        key={index}
                                        to={`/instance/${instance.name}`}
                                        state={{ instance }}
                                        className="text-decoration-none"
                                    >
                                        <div className="card mb-3">
                                            <div className="card-body d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="card-title mb-1">{instance.name}</h5>
                                                    {instance.description && (
                                                        <p className="card-text text-muted small mb-0">
                                                            {instance.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    {userIcon}
                                                    <span className="ms-2">{instance.players.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <Routes>
                <Route path="/gamemodes" element={<GamemodesPage />} />
                <Route path="/gamemodes/:gamemodeName/edit" element={<GamemodeEditPage />} />
                <Route
                    path="/instance/:instanceName"
                    element={<InstancePage instances={instances} proxies={proxies} />}
                />
                <Route
                    path="/proxy/:instanceName"
                    element={<InstancePage instances={instances} proxies={proxies} />}
                />
            </Routes>
        </div>
    );
});

export default App;