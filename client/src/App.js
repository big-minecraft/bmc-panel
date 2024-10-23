import React, {useLayoutEffect, useState, useRef, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes, Link, useParams} from 'react-router-dom';
import './App.css';
import axios from 'axios';

function App() {
    const [pods, setPods] = useState([]);
    const ref = useRef(null);

    useLayoutEffect(() => {
        axios.get('/api/servers')
            .then(res => {
                setPods(res.data);
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    return (
        <Router>
            <div ref={ref}>
                {pods.map((pod, index) => (
                    <Link key={index} to={`/pod/${pod.metadata.name}`}>
                        <button>
                            {pod.metadata.name}
                        </button>
                    </Link>
                ))}
            </div>
            <Routes>
                <Route path="/pod/:podName" element={<PodPage />} />
            </Routes>
        </Router>
    );
}

function PodPage() {
    const { podName } = useParams();
    const [logs, setLogs] = useState('');
    const [command, setCommand] = useState('');
    const [ws, setWs] = useState(null);

    useEffect(() => {
        setLogs('');

        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = window.location.host;
        const wsUrl = `${wsProtocol}://${wsHost.replace(':3000', ':3001')}/logs/${podName}`;

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
    }, [podName]);

    const handleCommandSubmit = () => {
        if (ws && command) {
            ws.send(JSON.stringify({ command }));
            setCommand('');
        }
    };

    return (
        <div>
            <h1>{podName}</h1>
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