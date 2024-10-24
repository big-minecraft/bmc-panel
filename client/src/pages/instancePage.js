import { useParams } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function InstancePage({ instances, proxies }) {
    const { instanceName } = useParams();
    const [logs, setLogs] = useState('');
    const [command, setCommand] = useState('');
    const [ws, setWs] = useState(null);
    const [instance, setInstance] = useState(null);
    const logsEndRef = useRef(null);

    useEffect(() => {
        const allInstances = [...instances, ...proxies];
        const currentInstance = allInstances.find(inst => inst.name === instanceName);
        setInstance(currentInstance);
    }, [instanceName, instances, proxies]);

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

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const handleCommandSubmit = () => {
        if (ws && command) {
            ws.send(JSON.stringify({ command }));
            setCommand('');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleCommandSubmit();
        }
    };

    if (!instance) {
        return <div className="container">Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <style>
                {`
                    .log-pre {
                        white-space: pre-wrap;
                    }
                `}
            </style>
            <h1 className="text-center">{instanceName}</h1>

            <div className="mb-3">
                <h3>Instance Details:</h3>
                <p><strong>UID:</strong> {instance.uid}</p>
                <p><strong>Pod Name:</strong> {instance.podName}</p>
                <p><strong>IP:</strong> {instance.ip}</p>
            </div>

            <div className="card bg-dark text-light mb-3" style={{ height: '400px', overflowY: 'auto' }}>
                <div className="card-body">
                    <pre className="m-0 log-pre">{logs}</pre>
                    <div ref={logsEndRef} />
                </div>
            </div>

            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter command here"
                />
                <button className="btn btn-primary" onClick={handleCommandSubmit}>Send Command</button>
            </div>
        </div>
    );
}

export { InstancePage };