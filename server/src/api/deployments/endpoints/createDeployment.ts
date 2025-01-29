import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import deploymentService from "../../../services/deploymentService";

const createDeploymentSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['persistent', 'non-persistent']),
    node: z.string().min(1),
}).strict();

export type CreateDeploymentRequest = z.infer<typeof createDeploymentSchema>;

export interface CreateDeploymentResponse {
    message: string;
}

export const createDeploymentEndpoint: ApiEndpoint<CreateDeploymentRequest, CreateDeploymentResponse> = {
    path: '/api/deployment',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: CreateDeploymentRequest = createDeploymentSchema.parse(req.body);
            await deploymentService.createDeployment(data.name, data.type, data.node);
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