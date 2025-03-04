import {useState, useEffect, useRef} from 'react';
import {Send, Terminal} from 'lucide-react';

const Console = ({instance, onWebSocketReady, onStateUpdate}) => {
    const [logs, setLogs] = useState([]);
    const [command, setCommand] = useState('');
    const [ws, setWs] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const consoleRef = useRef(null);
    const wsRef = useRef(null);
    const controllerRef = useRef(null);
    const connectionAttemptedRef = useRef(false); // Track if connection was attempted

    const closeWebSocket = (socket, message) => {
        if (socket && socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
            try {
                socket.close();
            } catch (err) {
                console.error('error closing websocket', err);
            }
        }

        setWs(null);
        setIsConnecting(false);

        if (message) {
            setLogs(prevLogs => [...prevLogs, {
                type: 'error',
                content: message
            }]);
        }
    };

    const connectWebSocket = () => {
        console.log('connecting to websocket...');
        // Only connect if we haven't attempted a connection yet
        if (isConnecting || wsRef.current || connectionAttemptedRef.current) return;

        connectionAttemptedRef.current = true; // Mark that we've attempted a connection

        if (controllerRef.current) controllerRef.current.abort();
        controllerRef.current = new AbortController();

        setIsConnecting(true);
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = window.location.host;
        const wsUrl = `${wsProtocol}://${wsHost}/api/logs/${instance.deployment}/${instance.podName}`;

        try {
            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                console.log('websocket connection opened');
                setIsConnecting(false);
                setLogs(prevLogs => [...prevLogs, {
                    type: 'message',
                    content: '[System] Connected to pod terminal.'
                }]);
                setWs(socket);
                onWebSocketReady(socket);
            };

            socket.onmessage = (event) => {
                // Check if this connection has been aborted
                if (controllerRef.current?.signal.aborted) return;
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
                    console.error('error parsing message:', error);
                    setLogs(prevLogs => [...prevLogs, {
                        type: 'error',
                        content: '[System] Error parsing message'
                    }]);
                }
            };

            socket.onerror = (error) => {
                console.error('websocket error:', error);
                setLogs(prevLogs => [...prevLogs, {
                    type: 'error',
                    content: '[System] Connection error occurred.'
                }]);
            };

            socket.onclose = (event) => {
                console.log('websocket connection closed', event);

                if (wsRef.current === socket) {
                    wsRef.current = null;
                    setWs(null);
                    setIsConnecting(false);

                    setLogs(prevLogs => [...prevLogs, {
                        type: 'error',
                        content: '[System] Socket closed unexpectedly.'
                    }]);
                }
            };
        } catch (error) {
            console.error('error creating websocket:', error);
            setIsConnecting(false);
            setLogs(prevLogs => [...prevLogs, {
                type: 'error',
                content: '[System] Failed to establish connection.'
            }]);
        }
    };

    useEffect(() => {
        // Reset connection attempt flag when instance changes
        connectionAttemptedRef.current = false;
        connectWebSocket();

        return () => {
            if (controllerRef.current) controllerRef.current.abort();

            if (wsRef.current) {
                console.log('cleaning up websocket connection');
                closeWebSocket(wsRef.current, '[System] React: Component unmounted. Closing existing connection.');
                wsRef.current = null;
            }

            // Reset connection attempt flag on cleanup
            connectionAttemptedRef.current = false;
        };
    }, [instance]);

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
                <span className="text-sm">Connected to {instance.podName}</span>
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