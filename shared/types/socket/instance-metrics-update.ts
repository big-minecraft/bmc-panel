import { InstanceResourceMetrics } from '../../model/instance';

export interface InstanceMetricsUpdate {
    podName: string;
    deployment: string;
    metrics: InstanceResourceMetrics;
}
