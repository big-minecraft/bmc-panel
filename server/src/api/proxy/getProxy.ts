import {ApiEndpoint, AuthType} from '../types';
import {ProxyConfig} from "../../services/proxyService";

export interface GetProxyResponse {
    proxy: ProxyConfig;
}

export const getProxyEndpoint: ApiEndpoint<unknown, GetProxyResponse> = {
    path: '/api/proxy',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        // try {
        //     const proxy = await proxyService.getProxyConfig();
        //     res.json({
        //         success: true,
        //         data: {
        //             proxy
        //         }
        //     });
        // } catch (error) {
        //     console.error('Failed to fetch proxy:', error);
        //     let message: string = 'Failed to fetch proxy';
        //
        //     res.status(500).json({
        //         success: false,
        //         error: message
        //     });
        // }
    }
};