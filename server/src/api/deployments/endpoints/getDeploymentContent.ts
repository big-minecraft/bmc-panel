import {ApiEndpoint, AuthType} from '../../types';
import deploymentService from "../../../services/deploymentService";

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

            const content = await deploymentService.getDeploymentContent(name);

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