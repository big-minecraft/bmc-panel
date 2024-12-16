import { useParams } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import CPUChart from "../components/instances/CPUChart";
import MemoryChart from "../components/instances/MemoryChart";

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
        const wsUrl = `${wsProtocol}://${wsHost.replace('3000', '3001')}/api/logs/${instance.podName}`;

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

            <div className="card bg-dark text-light mb-3"
                 style={{height: '630px', overflowY: 'auto', marginTop: "100px"}}>
                <div className="card-body">
                    <pre className="m-0 log-pre">{logs}</pre>
                    <div ref={logsEndRef}/>
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

            <div className="card mb-3">
                <div className="card-header">
                    <h3>Instance Details</h3>
                </div>
                <div className="card-body">
                    <p><strong>Pod Name:</strong> {instance.podName}</p>
                    <p><strong>IP:</strong> {instance.ip}</p>
                    <p><strong>Players:</strong> {Object.keys(instance.players).length}</p>
                </div>
            </div>

            <div className="card mb-3"> {/* Added this wrapper div */}
                <div className="card-header">
                    <h3>CPU Usage</h3>
                </div>
                <div className="card-body">
                    <CPUChart podName={instance.podName}/>
                </div>
            </div>

            <div className="card mb-3"> {/* Added this wrapper div */}
                <div className="card-header">
                    <h3>Memory Usage</h3>
                </div>
                <div className="card-body">
                    <MemoryChart podName={instance.podName}/>
                </div>
            </div>
        </div>
    );
}

export default InstancePage;