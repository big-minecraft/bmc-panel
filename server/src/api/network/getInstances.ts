import {ApiEndpoint, AuthType} from '../types';
import redisService, {Instance} from "../../services/redisService";

export interface GetInstancesResponse {
    instances: Instance[];
}

export const getInstancesEndpoint: ApiEndpoint<unknown, GetInstancesResponse> = {
    path: '/api/network/instances',
    method: 'get',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const instances = await redisService.getInstances();

            res.json({
                success: true,
                data: {
                    instances
                }
            });
        } catch (error) {
            let message: string = 'Failed to fetch instances';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};