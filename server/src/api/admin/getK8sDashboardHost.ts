import {ApiEndpoint, AuthType} from '../types';
import K8sDashboardService from "../../services/k8sDashboardService";

export interface GetK8sDashboardHostResponse {
    host: string;
}

export const getK8sDashboardHostEndpoint: ApiEndpoint<unknown, GetK8sDashboardHostResponse> = {
    path: '/api/admin/k8sdashboard/host',
    method: 'get',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const host = K8sDashboardService.getInstance().getK8sDashboardHost()

            res.json({
                success: true,
                data: {
                    host
                }
            });
        } catch (error) {
            let message: string = 'Failed to get k8s dashboard host';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};
