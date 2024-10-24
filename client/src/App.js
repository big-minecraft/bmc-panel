import React, { useLayoutEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { InstancePage } from './pages/instancePage';
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    const [instances, setInstances] = useState([]);
    const ref = useRef(null);

    useLayoutEffect(() => {
        axios.get('/api/instances')
            .then(res => {
                setInstances(res.data);
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    return (
        <Router>
            <AppContent instances={instances} ref={ref} />
        </Router>
    );
}

const AppContent = React.forwardRef(({ instances }, ref) => {
    const location = useLocation();

    return (
        <div ref={ref} className="min-vh-100 bg-light p-4">
            {location.pathname === '/' && (
                <div className="container">
                    <h1 className="display-4 text-center mb-4">
                        Instance Manager
                    </h1>
                    <div className="list-group">
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
                                <span className="text-muted">&rarr;</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            <Routes>
                <Route
                    path="/instance/:instanceName"
                    element={<InstancePage instances={instances} />}
                />
            </Routes>
        </div>
    );
});

export default App;
