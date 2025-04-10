import {ApiEndpoint, AuthType} from '../types';
import {z} from "zod";
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";

const updateDeploymentContentSchema = z.object({
    content: z.string().min(1),
}).strict();

export type UpdateDeploymentContentRequest = z.infer<typeof updateDeploymentContentSchema>;


export interface UpdateDeploymentContentResponse {
    message: string;
}

export const updateDeploymentContentEndpoint: ApiEndpoint<UpdateDeploymentContentRequest, UpdateDeploymentContentResponse> = {
    path: '/api/deployments/:name',
    method: 'patch',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: UpdateDeploymentContentRequest = updateDeploymentContentSchema.parse(req.body);
            const name = req.params.name as string;

            const deploymentInstance = await DeploymentManager.getDeploymentByName(name);
            await deploymentInstance.updateContent(data.content);

            res.json({
                success: true,
                data: {
                    message: 'Deployment updated successfully',
                }
            });
        } catch (error) {
            console.error('Failed to update deployment content:', error);
            let message: string = 'Failed to update deployment content';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};