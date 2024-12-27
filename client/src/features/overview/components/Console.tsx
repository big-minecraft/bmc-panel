import React, {useState, useEffect, useRef} from 'react';
import {Send, Terminal} from 'lucide-react';

const Console = ({podName, onWebSocketReady, onStateUpdate}) => {
    const [logs, setLogs] = useState([]);
    const [command, setCommand] = useState('');
    const [ws, setWs] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const consoleRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;
    const baseReconnectDelay = 1000;

    const closeWebSocket = (socket, message) => {
        if (socket) {
            socket.close();
            setWs(null);
            setIsConnecting(false);
            reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent further reconnection attempts
            setLogs(prevLogs => [...prevLogs, {
                type: 'error',
                content: message || '[System] Connection terminated'
            }]);
        }
    };

    const connectWebSocket = () => {
        if (isConnecting) return;

        setIsConnecting(true);
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = window.location.host;
        const wsUrl = `${wsProtocol}://${wsHost.replace('3000', '3001')}/api/logs/${podName}`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connection opened');
            setIsConnecting(false);
            reconnectAttemptsRef.current = 0;
            setLogs(prevLogs => [...prevLogs, {
                type: 'message',
                content: '[System] Connected to pod terminal'
            }]);
            onWebSocketReady(socket);
        };

        socket.onmessage = (event) => {
            if (event.data === '') return;

            try {
                const parsedData = JSON.parse(event.data);
                if (!parsedData.type || !parsedData.content) return;

                if (parsedData.type === 'power') {
                    onStateUpdate?.(parsedData.content);
                    setLogs(prevLogs => [...prevLogs, {
                        type: 'message',
                        content: `[System] Instance state changed to: ${parsedData.content}`
                    }]);
                    return;
                }

                // Check for "Jar file not found!" message
                if (parsedData.content.includes('Jar file not found!')) {
                    closeWebSocket(socket, '[System] Jar file not found. Connection terminated.');
                    return;
                }

                const lines = parsedData.content.split('\n').filter(line => line.trim() !== '');

                lines.forEach(line => {
                    setLogs(prevLogs => [...prevLogs, {
                        type: parsedData.type,
                        content: line
                    }]);
                });

                if (consoleRef.current) {
                    const {scrollHeight, clientHeight, scrollTop} = consoleRef.current;
                    const isScrolledToBottom = scrollHeight - scrollTop === clientHeight;
                    if (isScrolledToBottom) {
                        setTimeout(() => {
                            if (consoleRef.current) {
                                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
                            }
                        }, 0);
                    }
                }
            } catch (error) {
                console.error('Error parsing message:', error);
                setLogs(prevLogs => [...prevLogs, {
                    type: 'error',
                    content: '[System] Error parsing message'
                }]);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setLogs(prevLogs => [...prevLogs, {
                type: 'error',
                content: '[System] Connection error occurred'
            }]);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed', event);
            setWs(null);
            setIsConnecting(false);

            // Only attempt to reconnect if we haven't reached max attempts and haven't received "Jar file not found!"
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {

            } else {
                setLogs(prevLogs => [...prevLogs, {
                    type: 'error',
                    content: '[System] Maximum reconnection attempts reached. Please refresh the page.'
                }]);
            }
        };

        setWs(socket);
    };

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, [podName]);

    const handleCommandSubmit = () => {
        if (ws && ws.readyState === WebSocket.OPEN && command) {
            ws.send(JSON.stringify({
                type: 'command',
                command: command
            }));
            setCommand('');
        }
    };

    const LogLine = ({ log }) => {
        const isSystemMessage = log.content.startsWith('[System]');
        return (
            <div className={`${
                log.type === 'error' ? 'text-red-500' :
                    isSystemMessage ? 'text-yellow-400' :
                        'text-gray-100'
            }`}>
                {log.content}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center text-gray-500 mb-4">
                <Terminal size={18} className="mr-2"/>
                <span className="text-sm">Connected to {podName}</span>
            </div>

            <div
                ref={consoleRef}
                className="bg-gray-900 rounded-lg h-[500px] overflow-y-auto font-mono text-sm"
            >
                <div className="p-4">
                    {logs.map((log, index) => (
                        <LogLine key={index} log={log} />
                    ))}
                </div>
            </div>

            <div className="relative">
                <input
                    type="text"
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCommandSubmit()}
                    placeholder="Enter command..."
                />
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={handleCommandSubmit}
                >
                    <Send size={18}/>
                </button>
            </div>
        </div>
    );
};

export default Console;