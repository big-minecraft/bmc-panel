import {ApiEndpoint, AuthType} from '../types';
import {z} from 'zod';
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";

const createDeploymentSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['persistent', 'scalable']),
    node: z.string().min(1).optional(),
}).strict();

export type CreateDeploymentRequest = z.infer<typeof createDeploymentSchema>;

export interface CreateDeploymentResponse {
    message: string;
}

export const createDeploymentEndpoint: ApiEndpoint<CreateDeploymentRequest, CreateDeploymentResponse> = {
    path: '/api/deployments',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: CreateDeploymentRequest = createDeploymentSchema.parse(req.body);
            await DeploymentManager.get().createDeployment(data.name, data.type, data.node);
            res.json({
                success: true,
                data: {
                    message: 'Deployment created successfully',
                }
            });
        } catch (error) {
            console.error('Failed to create deployment:', error);
            let message: string = 'Failed to create deployment';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};