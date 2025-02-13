import {ApiEndpoint, AuthType} from '../types';
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";

export interface GetDeploymentContentResponse {
    content: string;
}

export const getDeploymentContentEndpoint: ApiEndpoint<unknown, GetDeploymentContentResponse> = {
    path: '/api/deployments/:name',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            const deploymentInstance = DeploymentManager.getDeploymentByName(name);
            const content = await deploymentInstance.getContent();

            res.json({
                success: true,
                data: {
                    content
                }
            });
        } catch (error) {
            console.error('Failed to fetch deployment content:', error);
            let message: string = 'Failed to fetch deployment content';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};