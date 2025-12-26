import axios from 'axios';
import ConfigManager from "../features/config/controllers/configManager";

export interface TimeSeriesData {
    timestamp: number;
    value: string;
}

class PrometheusService {
    private static instance: PrometheusService;
    private readonly PROMETHEUS_API_URL: string;
    private readonly PROMETHEUS_INSTANT_URL: string;

    private constructor() {
        let config = ConfigManager.getConfig();
        const baseUrl = `http://${config.prometheus.host}:${config.prometheus.port}/api/v1`;
        this.PROMETHEUS_API_URL = `${baseUrl}/query_range`;
        this.PROMETHEUS_INSTANT_URL = `${baseUrl}/query`;
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

    private async fetchInstantMetric(query: string): Promise<number> {
        try {
            const response = await axios.get(this.PROMETHEUS_INSTANT_URL, {
                params: { query },
            });
            const result = response?.data?.data?.result;
            if (result && result.length > 0 && result[0].value) {
                return parseFloat(result[0].value[1]);
            }
            return 0;
        } catch (error) {
            console.log('error fetching instant metric:', error.message);
            return 0;
        }
    }

    public async getPodCPUUsageForGraph(podName: string, namespace: string = "default"): Promise<TimeSeriesData[]> {
        const query = `sum(irate(container_cpu_usage_seconds_total{pod="${podName}", namespace="${namespace}", container!=""}[2m]))`;

        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 60 * 5;
        const step = 15;

        const results = await this.fetchMetrics(query, startTime, endTime, step);

        if (!results || results.length === 0) {
            console.log(`no cpu data found for pod: ${podName} in namespace: ${namespace}`);
            return [];
        }

        const podData = results[0];

        return podData.values.map(([timestamp, value]: [number, string]) => ({
            timestamp: timestamp * 1000,
            value: parseFloat(value).toFixed(3),
        }));
    }

    public async getPodMemoryUsageForGraph(podName: string, namespace: string = "default"): Promise<TimeSeriesData[]> {
            const query = `sum(container_memory_working_set_bytes{pod="${podName}", namespace="${namespace}", container!=""})`;

        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - 60 * 5;
        const step = 15;

        const results = await this.fetchMetrics(query, startTime, endTime, step);

        if (!results || results.length === 0) {
            console.log(`no memory data found for pod: ${podName} in namespace: ${namespace}`);
            return [];
        }

        const podData = results[0];

        return podData.values.map(([timestamp, value]: [number, string]) => ({
            timestamp: timestamp * 1000,
            value: (parseFloat(value) / (1024 * 1024)).toFixed(2),
        }));
    }

    public async getCurrentCPUUsage(podName: string, namespace: string = "default"): Promise<number> {
        const query = `sum(irate(container_cpu_usage_seconds_total{pod="${podName}", namespace="${namespace}", container!=""}[2m]))`;
        return await this.fetchInstantMetric(query);
    }

    public async getCurrentMemoryUsage(podName: string, namespace: string = "default"): Promise<number> {
        const query = `sum(container_memory_working_set_bytes{pod="${podName}", namespace="${namespace}", container!=""})`;
        const bytes = await this.fetchInstantMetric(query);
        return bytes / (1024 * 1024); // Convert to MB
    }
}

export default PrometheusService;