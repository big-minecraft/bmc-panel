import React, {useLayoutEffect, useState, useRef, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes, Link, useParams} from 'react-router-dom';
import './App.css';
import axios from 'axios';

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
            <div ref={ref}>
                {instances.map((instance, index) => (
                    <Link key={index} to={`/instance/${instance.name}`} state={{ instance }}>
                        <button>
                            {instance.name}
                        </button>
                    </Link>
                ))}
            </div>
            <Routes>
                <Route
                    path="/instance/:instanceName"
                    element={<InstancePage instances={instances} />}
                />
            </Routes>
        </Router>
    );
}

function InstancePage({ instances }) {
    const { instanceName } = useParams();
    const [logs, setLogs] = useState('');
    const [command, setCommand] = useState('');
    const [ws, setWs] = useState(null);
    const [instance, setInstance] = useState(null);

    useEffect(() => {
        // Find the matching instance
        const currentInstance = instances.find(inst => inst.name === instanceName);
        setInstance(currentInstance);
    }, [instanceName, instances]);

    useEffect(() => {
        if (!instance) return;

        setLogs('');

        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = window.location.host;
        const wsUrl = `${wsProtocol}://${wsHost.replace(':3000', ':3001')}/logs/${instance.podName}`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connection opened');
        };

        socket.onmessage = (event) => {
            if (event.data === '') return;
            const logMessage = event.data.split('\n').filter(line => line.trim() !== '').join('\n');
            setLogs((prevLogs) => prevLogs + logMessage + '\n');
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, [instanceName, instance]);

    const handleCommandSubmit = () => {
        if (ws && command) {
            ws.send(JSON.stringify({ command }));
            setCommand('');
        }
    };

    if (!instance) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>{instanceName}</h1>
            {/* Display instance details */}
            <div>
                <h3>Instance Details:</h3>
                <p>UID: {instance.uid}</p>
                <p>Pod Name: {instance.podName}</p>
                <p>IP: {instance.ip}</p>
                {/* Add any other instance properties you want to display */}
            </div>

            <pre style={{ background: '#000', color: '#00FF00', height: '400px', overflow: 'auto' }}>
                {logs}
            </pre>

            <div>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command here"
                />
                <button onClick={handleCommandSubmit}>Send Command</button>
            </div>
        </div>
    );
}


export default App;