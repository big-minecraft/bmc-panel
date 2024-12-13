import React, { useEffect, useState } from 'react';
import axiosInstance from "../utils/auth";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const PodMemoryChart = ({ podName }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`/api/metrics/memory?pod=${podName}`);
                const formattedData = response.data.map(point => ({
                    timestamp: new Date(point.timestamp).toLocaleTimeString(),
                    value: parseFloat((point.value / 1024).toFixed(2)) // Convert KB to MB
                }));
                setData(formattedData);
            } catch (err) {
                setError(err.message);
                console.log('error fetching memory metrics:', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [podName]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '325px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" style={{ minHeight: '325px' }} role="alert">
                Error loading memory metrics: {error}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '325px', minHeight: '325px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 60, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="timestamp"
                        label={{ value: 'Time', position: 'bottom', offset: 15 }}
                    />
                    <YAxis
                        label={{ value: 'Memory Usage (MB)', angle: -90, position: 'left', offset: 40 }}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip formatter={(value) => [`${value} MB`, 'Memory Usage']} />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#198754"  // Bootstrap success green color
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PodMemoryChart;