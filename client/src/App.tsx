import React, { useLayoutEffect, useState, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavigationBar from "./features/navbar/components/NavigationBar";
import AppRoutes from "./routes/AppRoutes";
import axiosInstance from "./utils/auth";
import { AuthProvider } from './features/auth/context/AuthContext';

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
            <AuthProvider>
                <div ref={ref} className="min-h-screen bg-gray-50">
                    <NavigationBar />
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <AppRoutes instances={instances} proxies={proxies} />
                    </div>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;