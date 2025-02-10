import {ApiEndpoint, AuthType} from '../../types';
import prometheusService, {TimeSeriesData} from "../../../services/prometheusService";

export interface GetMemoryMetricsResponse {
    data: TimeSeriesData[];
}

export const getMemoryMetricsEndpoint: ApiEndpoint<unknown, GetMemoryMetricsResponse> = {
    path: '/api/metrics/memory',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const { pod } = req.query;
            const data = await prometheusService.getPodMemoryUsageForGraph(pod as string);

            res.json({
                success: true,
                data: {
                    data
                }
            });
        } catch (error) {
            console.error('Failed to fetch Memory usage data:', error);
            let message: string = 'Failed to fetch Memory usage data';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};