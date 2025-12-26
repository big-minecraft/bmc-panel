import {useParams, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {ArrowLeft, Activity, Server, Users, Play, RotateCw, Square, XCircle} from 'lucide-react';
import Console from "../components/Console";
import InstanceDetails from "../components/InstanceDetails";
import MetricsSection from "../components/MetricsSection";
import axiosInstance from "../../../utils/auth.ts";
import {Enum} from "../../../../../shared/enum/enum.ts";
import {getInstanceStateDetails} from "../constants/instanceState.ts";
import {useSocket} from "../../socket/context/SocketContext.tsx";
import InstanceMetricsListener from "../listeners/InstanceMetricsListener.ts";
import {InstanceResourceMetrics} from "../../../../../shared/model/instance.ts";

function ServerInstance() {
    const {deploymentName, instanceUid} = useParams();
    const navigate = useNavigate();
    const {addListener, removeListener} = useSocket();
    const [activeTab, setActiveTab] = useState('console');
    const [websocket, setWebsocket] = useState(null);
    const [instance, setInstance] = useState(null);
    const [instanceState, setInstanceState] = useState(null);
    const [metrics, setMetrics] = useState<InstanceResourceMetrics | null>(null);

    useEffect(() => {
        fetchInstance();
    }, []);

    useEffect(() => {
        if (!instance) return;

        const metricsListener = new InstanceMetricsListener((data) => {
            if (data.podName === instance.podName) {
                setMetrics(data.metrics);
            }
        });

        addListener(metricsListener);
        return () => removeListener(metricsListener);
    }, [instance?.podName, addListener, removeListener]);

    const handleStateUpdate = (newState) => {
        setInstanceState(Enum.InstanceState.fromString(newState));
    };

    const handleWebSocketReady = (ws) => {
        setWebsocket(ws);
    };

    const sendCommand = (command) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({
                type: 'power',
                action: command
            }));
        } else {
            console.error('WebSocket is not connected');
        }
    };

    const fetchInstance = async () => {
        try {
            const res = await axiosInstance.get(`/api/deployments/${deploymentName}/instances`);
            const instances = res.data.data.instances;

            const instance = instances.find((instance: { uid: string; }) => instance.uid === instanceUid);
            setInstance(instance);
            setInstanceState(Enum.InstanceState.fromString(instance.state));
        } catch (err) {
            console.error(err);
        }
    }

    const handleStart = () => sendCommand('start');
    const handleStop = () => sendCommand('stop');
    const handleRestart = () => sendCommand('restart');
    const handleKill = () => {
        sendCommand('kill');
        setTimeout(() => {
            navigate('/');
        }, 1000);
    };

    if (!instance) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const TabButton = ({id, icon: Icon, label}) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
            <Icon size={18} className="mr-2"/>
            {label}
        </button>
    );

    const ActionButton = ({icon: Icon, label, variant = 'default', onClick, disabled}) => {
        const variants = {
            default: 'text-gray-600 hover:bg-gray-50',
            start: 'text-green-600 hover:bg-green-50',
            stop: 'text-red-600 hover:bg-red-50',
            restart: 'text-orange-600 hover:bg-orange-50',
            kill: 'text-red-700 hover:bg-red-50'
        };

        return (
            <button
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${variants[variant]} ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={onClick}
                disabled={disabled}
            >
                <Icon size={18} className="mr-2"/>
                {label}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
                    >
                        <ArrowLeft size={20}/>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 ml-4">{instance.name}</h1>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-blue-600">
                                <Server size={20} className="mr-2"/>
                                <h3 className="font-medium">Status</h3>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`w-2.5 h-2.5 rounded-full ${instanceState.color.replace('text-', 'bg-')} mr-2`}></div>
                                <p className={`text-2xl font-semibold ${instanceState.color}`}>
                                    {instanceState.displayName}
                                </p>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <span className="font-medium mr-1.5">{metrics?.connections ?? 0}</span>
                                <Users size={16}/>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center text-purple-600 mb-2">
                            <Activity size={20} className="mr-2"/>
                            <h3 className="font-medium">Uptime</h3>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900">{metrics?.uptime || 'Unknown'}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center text-emerald-600 mb-2">
                            <Activity size={20} className="mr-2"/>
                            <h3 className="font-medium">CPU Usage</h3>
                        </div>
                        <div className="flex flex-col">
                            {metrics?.cpu ? (
                                <>
                                    <div className="flex items-baseline">
                                        <span className="text-2xl font-semibold text-gray-900">
                                            {metrics.cpu.usage.toFixed(2)}
                                        </span>
                                        {(metrics.cpu.limit !== undefined && metrics.cpu.limit > 0) && (
                                            <>
                                                <span className="text-gray-500 mx-1">/</span>
                                                <span className="text-xl font-medium text-gray-700">
                                                    {metrics.cpu.limit.toFixed(2)}
                                                </span>
                                            </>
                                        )}
                                        <span className="text-gray-500 ml-1">vCPU</span>
                                        {(metrics.cpu.limit !== undefined && metrics.cpu.limit > 0) && (
                                            <span className="text-sm text-gray-500 ml-2">
                                                ({((metrics.cpu.usage / metrics.cpu.limit) * 100).toFixed(0)}%)
                                            </span>
                                        )}
                                    </div>
                                    {(metrics.cpu.request !== undefined && metrics.cpu.request > 0) && (
                                        <span className="text-xs text-gray-500 mt-1">
                                            Guaranteed: {metrics.cpu.request.toFixed(2)} vCPU
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-2xl font-semibold text-gray-900">Loading...</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center text-blue-600 mb-2">
                            <Activity size={20} className="mr-2"/>
                            <h3 className="font-medium">Memory Usage</h3>
                        </div>
                        <div className="flex flex-col">
                            {metrics?.memory ? (
                                <>
                                    <div className="flex items-baseline">
                                        <span className="text-2xl font-semibold text-gray-900">
                                            {metrics.memory.usage.toFixed(0)}
                                        </span>
                                        {(metrics.memory.limit !== undefined && metrics.memory.limit > 0) && (
                                            <>
                                                <span className="text-gray-500 mx-1">/</span>
                                                <span className="text-xl font-medium text-gray-700">
                                                    {metrics.memory.limit.toFixed(0)}
                                                </span>
                                            </>
                                        )}
                                        <span className="text-gray-500 ml-1">MB</span>
                                        {(metrics.memory.limit !== undefined && metrics.memory.limit > 0) && (
                                            <span className="text-sm text-gray-500 ml-2">
                                                ({((metrics.memory.usage / metrics.memory.limit) * 100).toFixed(0)}%)
                                            </span>
                                        )}
                                    </div>
                                    {(metrics.memory.request !== undefined && metrics.memory.request > 0) && (
                                        <span className="text-xs text-gray-500 mt-1">
                                            Guaranteed: {metrics.memory.request.toFixed(0)} MB
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-2xl font-semibold text-gray-900">Loading...</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex space-x-4">
                            <TabButton id="console" icon={Server} label="Console"/>
                            <TabButton id="metrics" icon={Activity} label="Metrics"/>
                            <TabButton id="details" icon={Users} label="Details"/>
                        </div>
                        <div className="flex space-x-2">
                            {instance.type !== 'process' && (
                            <ActionButton
                                icon={Play}
                                label="Start"
                                variant="start"
                                onClick={handleStart}
                                disabled={instanceState.identifier === 'RUNNING' || instanceState.identifier === 'STARTING'}
                            />
                            )}
                            {instance.type !== 'process' && (
                                <ActionButton
                                    icon={RotateCw}
                                    label="Restart"
                                    variant="restart"
                                    onClick={handleRestart}
                                    disabled={instanceState.identifier === 'STOPPED' || instanceState.identifier === 'STOPPING'}
                                />
                            )}
                            <ActionButton
                                icon={Square}
                                label="Stop"
                                variant="stop"
                                onClick={handleStop}
                                disabled={instanceState.identifier === 'STOPPED' || instanceState.identifier === 'STOPPING'}
                            />
                            <ActionButton
                                icon={XCircle}
                                label="Kill"
                                variant="kill"
                                onClick={handleKill}
                                disabled={instanceState.identifier === 'STOPPED'}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {activeTab === 'console' && (
                        <Console
                            instance={instance}
                            onWebSocketReady={handleWebSocketReady}
                            onStateUpdate={handleStateUpdate}
                        />
                    )}
                    {activeTab === 'metrics' && <MetricsSection podName={instance.podName}/>}
                    {activeTab === 'details' && <InstanceDetails instance={instance}/>}
                </div>
            </div>
        </div>
    );
}

export default ServerInstance;
