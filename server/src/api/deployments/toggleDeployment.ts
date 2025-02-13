import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";

const toggleDeploymentSchema = z.object({
    enabled: z.boolean(),
}).strict();

export type ToggleDeploymentRequest = z.infer<typeof toggleDeploymentSchema>;

export interface ToggleDeploymentResponse {
    message: string;
}

export const toggleDeploymentEndpoint: ApiEndpoint<ToggleDeploymentRequest, ToggleDeploymentResponse> = {
    path: '/api/deployments/:name/toggle',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: ToggleDeploymentRequest = toggleDeploymentSchema.parse(req.body);
            const name = req.params.name as string;

            await DeploymentManager.getDeploymentByName(name).setEnabled(data.enabled);
            
            res.json({
                success: true,
                data: {
                    message: 'Deployment toggled successfully',
                }
            });
        } catch (error) {
            console.error('Failed to toggle deployment:', error);
            let message: string = 'Failed to toggle deployment';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};