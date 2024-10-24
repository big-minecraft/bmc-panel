import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function InstancePage({ instances }) {
    const { instanceName } = useParams();
    const [logs, setLogs] = useState('');
    const [command, setCommand] = useState('');
    const [ws, setWs] = useState(null);
    const [instance, setInstance] = useState(null);

    useEffect(() => {
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
        return <div className="container">Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <h1 className="text-center">{instanceName}</h1>

            <div className="mb-3">
                <h3>Instance Details:</h3>
                <p><strong>UID:</strong> {instance.uid}</p>
                <p><strong>Pod Name:</strong> {instance.podName}</p>
                <p><strong>IP:</strong> {instance.ip}</p>
            </div>

            <div className="card bg-dark text-light mb-3" style={{ height: '400px', overflowY: 'auto' }}>
                <div className="card-body">
                    <pre className="m-0">{logs}</pre>
                </div>
            </div>

            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command here"
                />
                <button className="btn btn-primary" onClick={handleCommandSubmit}>Send Command</button>
            </div>
        </div>
    );
}

export { InstancePage };
