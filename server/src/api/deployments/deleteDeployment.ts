import {ApiEndpoint, AuthType} from '../types';
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";

export interface DeleteDeploymentResponse {
    message: string;
}

export const deleteDeploymentEndpoint: ApiEndpoint<unknown, DeleteDeploymentResponse> = {
    path: '/api/deployments/:name',
    method: 'delete',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            await DeploymentManager.deleteDeployment(name);
            res.json({
                success: true,
                data: {
                    message: 'Deployment deleted successfully',
                }
            });
        } catch (error) {
            console.error('Failed to delete deployment:', error);
            let message: string = 'Failed to delete deployment';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};