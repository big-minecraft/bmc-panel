import {ApiEndpoint, AuthType} from '../../types';
import k8sDashboardService from "../../../services/k8sDashboardService";

export interface DeleteK8sTokenResponse {
    message: string;
}

export const deleteK8sTokenEndpoint: ApiEndpoint<unknown, DeleteK8sTokenResponse> = {
    path: '/api/admin/k8sdashboard/token',
    method: 'delete',
    auth: AuthType.Admin,
    handler: async (req, res) => {
        try {
            await k8sDashboardService.deleteK8sDashboardToken();
            
            res.json({
                success: true,
                data: {
                    message: 'Token deleted successfully',
                }
            });
        } catch (error) {
            console.error('Failed to delete k8s dashboard token:', error);
            let message: string = 'Failed to delete k8s dashboard token';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};