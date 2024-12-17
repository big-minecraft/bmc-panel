import { useParams, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { ArrowLeft, Activity, Server, Users, Play, RotateCw, Square, ChevronDown } from 'lucide-react';
import Console from "../components/instances/Console";
import InstanceDetails from "../components/instances/InstanceDetails";
import MetricsSection from "../components/instances/MetricsSection";

function ServerInstance({ instances, proxies }) {
    const { instanceName } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('console');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [status, setStatus] = useState('Active');

    const instance = [...instances, ...proxies].find(inst => inst.name === instanceName);

    const statusOptions = [
        { label: 'Active', color: 'bg-green-500' },
        { label: 'Starting', color: 'bg-yellow-500' },
        { label: 'Stopping', color: 'bg-orange-500' },
        { label: 'Stopped', color: 'bg-red-500' }
    ];

    const currentStatusColor = statusOptions.find(opt => opt.label === status)?.color || 'bg-gray-500';

    if (!instance) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
            <Icon size={18} className="mr-2" />
            {label}
        </button>
    );

    const ActionButton = ({ icon: Icon, label, variant = 'default' }) => {
        const variants = {
            default: 'text-gray-600 hover:bg-gray-50',
            start: 'text-green-600 hover:bg-green-50',
            stop: 'text-red-600 hover:bg-red-50',
            restart: 'text-orange-600 hover:bg-orange-50'
        };

        return (
            <button className={`flex items-center px-3 py-2 rounded-lg transition-colors ${variants[variant]}`}>
                <Icon size={18} className="mr-2" />
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
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 ml-4">{instanceName}</h1>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-blue-600">
                                <Server size={20} className="mr-2" />
                                <h3 className="font-medium">Status</h3>
                                <div className="relative ml-2">
                                    <button
                                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50"
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                    {showStatusDropdown && (
                                        <div className="absolute top-full right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                                            {statusOptions.map((option) => (
                                                <button
                                                    key={option.label}
                                                    onClick={() => {
                                                        setStatus(option.label);
                                                        setShowStatusDropdown(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${option.color} mr-2`}></div>
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`w-2.5 h-2.5 rounded-full ${currentStatusColor} mr-2`}></div>
                                <p className="text-2xl font-semibold text-gray-900">{status}</p>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <span className="font-medium mr-1.5">24</span>
                                <Users size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center text-purple-600 mb-2">
                            <Activity size={20} className="mr-2" />
                            <h3 className="font-medium">Uptime</h3>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900">6d 20h 50m</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center text-emerald-600 mb-2">
                            <Activity size={20} className="mr-2" />
                            <h3 className="font-medium">CPU Usage</h3>
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-2xl font-semibold text-gray-900">45.82%</span>
                            <span className="text-gray-500 ml-1">/ 100%</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center text-blue-600 mb-2">
                            <Activity size={20} className="mr-2" />
                            <h3 className="font-medium">Memory Usage</h3>
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-2xl font-semibold text-gray-900">2.45</span>
                            <span className="text-gray-500 ml-1">/ 4 GiB</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex space-x-4">
                            <TabButton id="console" icon={Server} label="Console" />
                            <TabButton id="metrics" icon={Activity} label="Metrics" />
                            <TabButton id="details" icon={Users} label="Details" />
                        </div>
                        <div className="flex space-x-2">
                            <ActionButton icon={Play} label="Start" variant="start" />
                            <ActionButton icon={RotateCw} label="Restart" variant="restart" />
                            <ActionButton icon={Square} label="Stop" variant="stop" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {activeTab === 'console' && <Console podName={instance.podName} />}
                    {activeTab === 'metrics' && <MetricsSection podName={instance.podName} />}
                    {activeTab === 'details' && <InstanceDetails instance={instance} />}
                </div>
            </div>
        </div>
    );
}

export default ServerInstance;