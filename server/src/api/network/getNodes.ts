import {ApiEndpoint, AuthType} from '../types';
import kubernetesService from "../../services/kubernetesService";

export interface GetNodesResponse {
    nodes: String[];
}

export const getNodesEndpoint: ApiEndpoint<unknown, GetNodesResponse> = {
    path: '/api/network/nodes',
    method: 'get',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const nodes = await kubernetesService.listNodeNames();

            res.json({
                success: true,
                data: {
                    nodes
                }
            });
        } catch (error) {
            let message: string = 'Failed to fetch nodes';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};