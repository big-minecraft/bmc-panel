import {ApiEndpoint, AuthType} from '../types';
import K8sDashboardService from "../../services/k8sDashboardService";

export interface GetK8sTokenResponse {
    token: string;
}

export const getK8sTokenEndpoint: ApiEndpoint<unknown, GetK8sTokenResponse> = {
    path: '/api/admin/k8sdashboard/token',
    method: 'get',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const token = await K8sDashboardService.getInstance().getK8sDashboardToken()
            
            res.json({
                success: true,
                data: {
                    token
                }
            });
        } catch (error) {
            console.error('Failed to get k8s dashboard token:', error);
            let message: string = 'Failed to get k8s dashboard token';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};
