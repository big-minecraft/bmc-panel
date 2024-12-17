import React, { useState, useEffect, useRef } from 'react';

const Console = ({ podName }) => {
    const [logs, setLogs] = useState('');
    const [command, setCommand] = useState('');
    const [ws, setWs] = useState(null);
    const consoleRef = useRef(null);

    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = window.location.host;
        const wsUrl = `${wsProtocol}://${wsHost.replace('3000', '3001')}/api/logs/${podName}`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('websocket connection opened')
        };

        socket.onmessage = (event) => {
            if (event.data === '') return;
            const logMessage = event.data.split('\n').filter(line => line.trim() !== '').join('\n');
            setLogs(prevLogs => {
                const newLogs = prevLogs + logMessage + '\n';
                if (consoleRef.current) {
                    const { scrollHeight, clientHeight, scrollTop } = consoleRef.current;
                    const isScrolledToBottom = scrollHeight - scrollTop === clientHeight;
                    if (isScrolledToBottom) {
                        setTimeout(() => {
                            if (consoleRef.current) {
                                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
                            }
                        }, 0);
                    }
                }
                return newLogs;
            });
        };

        socket.onerror = (error) => {
            console.error('websocket error:', error)
        };

        socket.onclose = (event) => {
            console.log('websocket connection closed', event)
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

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleCommandSubmit();
        }
    };

    return (
        <div className="mb-3">
            <style>
                {`
                    .log-pre {
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                `}
            </style>
            <div
                ref={consoleRef}
                className="card bg-dark text-light"
                style={{
                    height: '630px',
                    overflowY: 'auto',
                    marginTop: "20px"
                }}
            >
                <div className="card-body">
                    <pre className="m-0 log-pre">{logs}</pre>
                </div>
            </div>

            <div className="input-group mt-3">
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
};

export default Console;