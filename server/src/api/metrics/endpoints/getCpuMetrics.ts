import {ApiEndpoint, AuthType} from '../../types';
import prometheusService, {TimeSeriesData} from "../../../services/prometheusService";

export interface GetCpuMetricsResponse {
    data: TimeSeriesData[];
}

export const getCpuMetricsEndpoint: ApiEndpoint<unknown, GetCpuMetricsResponse> = {
    path: '/api/metrics/cpu',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const { pod } = req.query;
            const data = await prometheusService.getPodCPUUsageForGraph(pod as string);
            
            res.json({
                success: true,
                data: {
                    data
                }
            });
        } catch (error) {
            console.error('Failed to fetch CPU usage data:', error);
            let message: string = 'Failed to fetch CPU usage data';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};