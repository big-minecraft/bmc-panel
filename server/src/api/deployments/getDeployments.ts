import {ApiEndpoint, AuthType} from '../types';

import DeploymentManager from "../../features/deployments/controllers/deploymentManager";
import {DeploymentType} from "../../features/deployments/models/types";

export interface GetDeploymentsResponse {
    deployments: {
        name: string;
        path: string;
        enabled: boolean;
        dataDirectory: string;
        type: DeploymentType;
    }[];
}

export const getDeploymentsEndpoint: ApiEndpoint<unknown, GetDeploymentsResponse> = {
    path: '/api/deployments',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const deployments = DeploymentManager.getDeployments();
            res.json({
                success: true,
                data: {
                    deployments: deployments.map(deployment => deployment.toJSON())
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