import {ApiEndpoint, AuthType} from '../types';
import KubernetesService from "../../services/kubernetesService";
import RedisService from "../../services/redisService";

export interface GetManagerTimestampResponse {
    timestamp: number;
}

export const getManagerTimestampEndpoint: ApiEndpoint<unknown, GetManagerTimestampResponse> = {
    path: '/api/network/getManagerTimestamp',
    method: 'get',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const timestamp = await RedisService.getInstance().getManagerTimestamp();

            res.json({
                success: true,
                data: {
                    timestamp
                }
            });
        } catch (error) {
            let message: string = 'Failed to fetch manager timestamp';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};