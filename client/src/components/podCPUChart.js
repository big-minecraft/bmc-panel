import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const PodCPUChart = ({ podName }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/metrics/cpu?pod=${podName}`);
        const formattedData = response.data.map(point => ({
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
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="alert alert-danger" style={{ minHeight: '300px' }} role="alert">
          Error loading CPU metrics: {error}
        </div>
    );
  }

  return (
      // Added wrapper div with explicit height
      <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 60, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey="timestamp"
                label={{ value: 'Time', position: 'bottom', offset: 15 }}
            />
            <YAxis
                label={{ value: 'CPU Usage (mCPU)', angle: -90, position: 'left', offset: 40 }}
                domain={['auto', 'auto']}
            />
            <Tooltip />
            <Line
                type="monotone"
                dataKey="value"
                stroke="#0d6efd"
                dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
  );
};

export default PodCPUChart;