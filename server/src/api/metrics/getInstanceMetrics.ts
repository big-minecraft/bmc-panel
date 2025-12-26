import {ApiEndpoint, AuthType} from '../types';
import InstanceMetricsService from '../../services/instanceMetricsService';
import {InstanceResourceMetrics} from '../../../../shared/model/instance';

export interface GetInstanceMetricsResponse {
    podName: string;
    metrics: InstanceResourceMetrics;
}

export const getInstanceMetricsEndpoint: ApiEndpoint<unknown, GetInstanceMetricsResponse> = {
    path: '/api/metrics/instance',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const { pod } = req.query;

            if (!pod || typeof pod !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Pod name is required'
                });
            }

            const metricsService = InstanceMetricsService.getInstance();
            const metrics = await metricsService.getMetricsForPod(pod);

            res.json({
                success: true,
                data: {
                    podName: pod,
                    metrics
                }
            });
        } catch (error) {
            console.error('Failed to fetch instance metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch instance metrics'
            });
        }
    }
};
