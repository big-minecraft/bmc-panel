import {ApiEndpoint, AuthType} from '../types';
import K8sDashboardService from "../../services/k8sDashboardService";

export interface CreateK8sTokenResponse {
    token: string;
}

export const createK8sTokenEndpoint: ApiEndpoint<unknown, CreateK8sTokenResponse> = {
    path: '/api/admin/k8sdashboard/token',
    method: 'post',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            const token = await K8sDashboardService.getInstance().createK8sDashboardToken();

            res.json({
                success: true,
                data: {
                    token
                }
            });
        } catch (error) {
            console.error('Failed to create k8s dashboard token:', error);
            let message: string = 'Failed to create k8s dashboard token';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};