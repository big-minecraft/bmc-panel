import {ApiEndpoint, AuthType} from '../types';
import deploymentsService from "../../services/deploymentService";
import {Deployment} from "../../services/deploymentService";

export interface GetDeploymentsResponse {
    deployments: Deployment[];
}

export const getDeploymentsEndpoint: ApiEndpoint<unknown, GetDeploymentsResponse> = {
    path: '/api/deployments',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const deployments = await deploymentsService.getDeployments();
            res.json({
                success: true,
                data: {
                    deployments
                }
            });
        } catch (error) {
            console.error('Failed to fetch deployments:', error);
            let message: string = 'Failed to fetch deployments';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};