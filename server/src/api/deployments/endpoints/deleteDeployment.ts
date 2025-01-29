import {ApiEndpoint, AuthType} from '../../types';
import deploymentService from "../../../services/deploymentService";

export interface DeleteDeploymentResponse {
    message: string;
}

export const deleteDeploymentEndpoint: ApiEndpoint<unknown, DeleteDeploymentResponse> = {
    path: '/api/deployment/:name',
    method: 'delete',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            await deploymentService.deleteDeployment(name);
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