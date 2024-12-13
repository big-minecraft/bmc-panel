const axios = require('axios');
const config = require('../config');

const PROMETHEUS_API_URL = `http://${config.prometheus.host}:${config.prometheus.port}/api/v1/query_range`;

async function getPodCPUUsageForGraph(podName) {
    try {
        const query = `rate(container_cpu_usage_seconds_total{pod="${podName}"}[1m]) * 1000`;
        const endTime = Math.floor(Date.now() / 1000); // Current time in seconds
        const startTime = endTime - 60 * 5; // Last 5 minutes
        const step = 15; // Step size in seconds

        const response = await axios.get(PROMETHEUS_API_URL, {
            params: { query, start: startTime, end: endTime, step },
        });

        const results = response?.data?.data?.result || [];

        if (results.length === 0) {
            console.log(`no cpu data found for pod: ${podName}`);
            return [];
        }

        // Combine all results and their timestamps
        const timeSeriesMap = new Map();

        results.forEach(result => {
            if (result.values) {
                result.values.forEach(([timestamp, value]) => {
                    const ts = timestamp * 1000; // Convert to milliseconds
                    const currentValue = timeSeriesMap.get(ts) || 0;
                    timeSeriesMap.set(ts, currentValue + (parseFloat(value) || 0));
                });
            }
        });

        // Convert map to sorted array
        return Array.from(timeSeriesMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([timestamp, value]) => ({
                timestamp,
                value: value.toFixed(3)
            }));

    } catch (error) {
        console.log('error fetching cpu metrics:', error.message);
        return [];
    }
}

async function getPodMemoryUsageForGraph(podName) {
    try {
        const query = `container_memory_usage_bytes{pod="${podName}"}`;
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 60 * 5;
        const step = 15;

        const response = await axios.get(PROMETHEUS_API_URL, {
            params: { query, start: startTime, end: endTime, step },
        });

        const results = response?.data?.data?.result || [];

        if (results.length === 0) {
            console.log(`no memory data found for pod: ${podName}`);
            return [];
        }

        // Combine all results and their timestamps
        const timeSeriesMap = new Map();

        results.forEach(result => {
            if (result.values) {
                result.values.forEach(([timestamp, value]) => {
                    const ts = timestamp * 1000; // Convert to milliseconds
                    const currentValue = timeSeriesMap.get(ts) || 0;
                    timeSeriesMap.set(ts, currentValue + (parseFloat(value) || 0));
                });
            }
        });

        // Convert map to sorted array and convert bytes to MB
        return Array.from(timeSeriesMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([timestamp, value]) => ({
                timestamp,
                value: (value / (1024 * 1024)).toFixed(2) // Convert to MB
            }));

    } catch (error) {
        console.log('error fetching memory metrics:', error.message);
        return [];
    }
}

module.exports = {
    getPodCPUUsageForGraph,
    getPodMemoryUsageForGraph,
};