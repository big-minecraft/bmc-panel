import axios from 'axios';
import config from '../config';

const PROMETHEUS_API_URL = `http://${config.prometheus.host}:${config.prometheus.port}/api/v1/query_range`;

export interface TimeSeriesData {
    timestamp: number;
    value: string;
}

class PrometheusService {
    private static instance: PrometheusService;

    private constructor() {}

    public static getInstance(): PrometheusService {
        if (!PrometheusService.instance) {
            PrometheusService.instance = new PrometheusService();
        }
        return PrometheusService.instance;
    }

    private async fetchMetrics(query: string, startTime: number, endTime: number, step: number) {
        try {
            const response = await axios.get(PROMETHEUS_API_URL, {
                params: { query, start: startTime, end: endTime, step },
            });
            return response?.data?.data?.result || [];
        } catch (error) {
            console.log('error fetching metrics:', error.message);
            return [];
        }
    }

    public async getPodCPUUsageForGraph(podName: string): Promise<TimeSeriesData[]> {
        const query = `sum(rate(container_cpu_usage_seconds_total{pod="${podName}"}[1m])) / sum(machine_cpu_cores) * 100`;
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
        const query = `sum(container_memory_working_set_bytes{pod="${podName}"})`;
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
                    const ts = timestamp * 1000;
                    const memoryBytes = parseFloat(value) || 0;
                    timeSeriesMap.set(ts, memoryBytes);
                });
            }
        });

        return Array.from(timeSeriesMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([timestamp, bytes]) => {
                const mbValue = bytes / (1024 * 1024);
                return {
                    timestamp,
                    value: mbValue < 1 ? mbValue.toFixed(3) : mbValue.toFixed(2),
                };
            });
    }
}

export default PrometheusService.getInstance();