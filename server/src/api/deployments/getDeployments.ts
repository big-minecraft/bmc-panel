import {ApiEndpoint, AuthType} from '../types';

import {Deployment} from "../../features/deployments/models/deployment";
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";

export interface GetDeploymentsResponse {
    deployments: Deployment[];
}

export const getDeploymentsEndpoint: ApiEndpoint<unknown, GetDeploymentsResponse> = {
    path: '/api/deployments',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const deployments = await DeploymentManager.get().getDeployments();
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