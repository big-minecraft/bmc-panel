import {ApiEndpoint, AuthType} from '../../types';
import redisService, {Proxy} from "../../../services/redisService";

export interface GetProxiesResponse {
    proxies: Proxy[];
}

export const getProxiesEndpoint: ApiEndpoint<unknown, GetProxiesResponse> = {
    path: '/api/network/proxies',
    method: 'get',
    auth: AuthType.None,
    handler: async (req, res) => {
        try {
            const proxies = await redisService.getProxies();

            res.json({
                success: true,
                data: {
                    proxies
                }
            });
        } catch (error) {
            let message: string = 'Failed to fetch proxies';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};