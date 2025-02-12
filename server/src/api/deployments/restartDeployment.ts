import {ApiEndpoint, AuthType} from '../types';
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";

export interface RestartDeploymentResponse {
    message: string;
}

export const restartDeploymentEndpoint: ApiEndpoint<unknown, RestartDeploymentResponse> = {
    path: '/api/deployments/:name/restart',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            await DeploymentManager.get().restartDeployment(name);
            res.json({
                success: true,
                data: {
                    message: 'Deployment restarted successfully',
                }
            });
        } catch (error) {
            console.error('Failed to restart deployment:', error);
            let message: string = 'Failed to restart deployment';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};