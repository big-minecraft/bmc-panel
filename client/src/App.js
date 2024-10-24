import React, { useLayoutEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { InstancePage } from './pages/instancePage';
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

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

    return (
        <div ref={ref} className="min-vh-100 bg-light p-4">
            <Link to="/" className="btn position-absolute top-0 start-0 m-3" style={{ backgroundColor: 'white', border: '1px solid black', color: 'black' }}>Big Minecraft</Link>
            {location.pathname === '/' && (
                <div className="container">
                    <h1 className="display-4 text-center mb-4">
                        Instance Manager
                    </h1>
                    <div className="list-group mb-4">
                        <h2 className="h5">Proxies</h2>
                        {proxies.map((proxy, index) => (
                            <Link
                                key={index}
                                to={`/proxy/${proxy.name}`}
                                state={{ proxy }}
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center rounded-pill mb-2"
                                style={{ textDecoration: 'none' }}
                            >
                                <div>
                                    <h5 className="mb-0">{proxy.name}</h5>
                                    {proxy.description && (
                                        <small className="text-muted">
                                            {proxy.description}
                                        </small>
                                    )}
                                </div>
                                <div className="d-flex align-items-center">
                                    {userIcon}
                                    <span className="ms-2">{proxy.players.length}</span>
                                    <span className="text-muted ms-2">&rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="list-group">
                        <h2 className="h5">Instances</h2>
                        {instances.map((instance, index) => (
                            <Link
                                key={index}
                                to={`/instance/${instance.name}`}
                                state={{ instance }}
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center rounded-pill mb-2"
                                style={{ textDecoration: 'none' }}
                            >
                                <div>
                                    <h5 className="mb-0">{instance.name}</h5>
                                    {instance.description && (
                                        <small className="text-muted">
                                            {instance.description}
                                        </small>
                                    )}
                                </div>
                                <div className="d-flex align-items-center">
                                    {userIcon}
                                    <span className="ms-2">{instance.players.length}</span>
                                    <span className="text-muted ms-2">&rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            <Routes>
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