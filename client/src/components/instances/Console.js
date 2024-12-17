import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal } from 'lucide-react';

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
        <div className="space-y-4">
            <div className="flex items-center text-gray-500 mb-4">
                <Terminal size={18} className="mr-2" />
                <span className="text-sm">Connected to {podName}</span>
            </div>

            <div
                ref={consoleRef}
                className="bg-gray-900 text-gray-100 rounded-lg h-[500px] overflow-y-auto font-mono text-sm"
            >
                <div className="p-4">
                    <pre className="whitespace-pre-wrap break-words">{logs}</pre>
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
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default Console;