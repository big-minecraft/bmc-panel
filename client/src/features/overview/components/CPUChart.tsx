import React, {useEffect, useState} from 'react';
import axiosInstance from "../../../utils/auth";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const CPUChart = ({podName}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`/api/metrics/cpu?pod=${podName}`);
                const formattedData = response.data.data.map(point => ({
                    timestamp: new Date(point.timestamp).toLocaleTimeString(),
                    value: parseFloat(point.value)
                }));
                setData(formattedData);
            } catch (err) {
                setError(err.message);
                console.log('error fetching cpu metrics:', err.message);
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
            <div className="flex justify-center items-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[300px] p-4 bg-red-50 text-red-600 rounded-lg">
                Error loading CPU metrics: {error}
            </div>
        );
    }

    return (
        <div className="w-full h-[300px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{top: 15, right: 30, left: 60, bottom: 40}}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis
                        dataKey="timestamp"
                        label={{value: 'Time', position: 'bottom', offset: 20}}
                    />
                    <YAxis
                        label={{value: 'CPU Usage (mCPU)', angle: -90, position: 'left', offset: 40}}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip/>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CPUChart;