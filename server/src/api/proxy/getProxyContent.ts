import {ApiEndpoint, AuthType} from '../types';
import proxyService from "../../services/proxyService";

export interface GetProxyContentResponse {
    content: string;
}

export const getProxyContentEndpoint: ApiEndpoint<unknown, GetProxyContentResponse> = {
    path: '/api/proxy/content',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        // try {
        //     const content = await proxyService.getProxyContent();
        //
        //     res.json({
        //         success: true,
        //         data: {
        //             content
        //         }
        //     });
        // } catch (error) {
        //     console.error('Failed to fetch proxy content:', error);
        //     let message: string = 'Failed to fetch proxy content';
        //
        //     res.status(500).json({
        //         success: false,
        //         error: message
        //     });
        // }
    }
};