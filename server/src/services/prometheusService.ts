import axios from 'axios';
import ConfigManager from "../features/config/controllers/configManager";

export interface TimeSeriesData {
    timestamp: number;
    value: string;
}

class PrometheusService {
    private static instance: PrometheusService;
    private PROMETHEUS_API_URL: string;

    private constructor() {
        let config = ConfigManager.getConfig();
        this.PROMETHEUS_API_URL = `http://${config.prometheus.host}:${config.prometheus.port}/api/v1/query_range`;
    }

    public static getInstance(): PrometheusService {
        return PrometheusService.instance;
    }

    public static init() {
        PrometheusService.instance = new PrometheusService();
    }

    private async fetchMetrics(query: string, startTime: number, endTime: number, step: number) {
        try {
            const response = await axios.get(this.PROMETHEUS_API_URL, {
                params: { query, start: startTime, end: endTime, step },
            });
            return response?.data?.data?.result || [];
        } catch (error) {
            console.log('error fetching metrics:', error.message);
            return [];
        }
    }

    public async getPodCPUUsageForGraph(podName: string): Promise<TimeSeriesData[]> {
        const query = `rate(container_cpu_usage_seconds_total{pod="${podName}"}[1m]) * 1000`;
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 60 * 5;
        const step = 15;

        const results = await this.fetchMetrics(query, startTime, endTime, step);

        if (results.length === 0) {
            console.log(`no cpu data found for pod: ${podName}`);
            return [];
        }

        const timeSeriesMap = new Map<number, number>();

        results.forEach((result: any) => {
            if (result.values) {
                result.values.forEach(([timestamp, value]: [number, string]) => {
                    const ts = timestamp * 1000; // Convert to milliseconds
                    const currentValue = timeSeriesMap.get(ts) || 0;
                    timeSeriesMap.set(ts, currentValue + (parseFloat(value) || 0));
                });
            }
        });

        return Array.from(timeSeriesMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([timestamp, value]) => ({
                timestamp,
                value: value.toFixed(3),
            }));
    }

    public async getPodMemoryUsageForGraph(podName: string): Promise<TimeSeriesData[]> {
        const query = `container_memory_working_set_bytes{pod="${podName}"}`;
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 60 * 5;
        const step = 15;

        const results = await this.fetchMetrics(query, startTime, endTime, step);

        if (results.length === 0) {
            console.log(`no memory data found for pod: ${podName}`);
            return [];
        }

        const timeSeriesMap = new Map<number, number>();

        results.forEach((result: any) => {
            if (result.values) {
                result.values.forEach(([timestamp, value]: [number, string]) => {
                    const ts = timestamp * 1000; // Convert to milliseconds
                    const currentValue = timeSeriesMap.get(ts) || 0;
                    timeSeriesMap.set(ts, currentValue + (parseFloat(value) || 0));
                });
            }
        });

        return Array.from(timeSeriesMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([timestamp, value]) => ({
                timestamp,
                value: (value / (1024 * 1024)).toFixed(2),
            }));
    }
}

export default PrometheusService;