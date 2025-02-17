import {ApiEndpoint, AuthType} from '../types';
import proxyService from "../../services/proxyService";

export interface RestartProxyResponse {
    message: string;
}

export const restartProxyEndpoint: ApiEndpoint<unknown, RestartProxyResponse> = {
    path: '/api/proxy/restart',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        // try {
        //     await proxyService.restartProxy();
        //     res.json({
        //         success: true,
        //         data: {
        //             message: 'Proxy restarted successfully',
        //         }
        //     });
        // } catch (error) {
        //     console.error('Failed to restart proxy:', error);
        //     let message: string = 'Failed to restart proxy';
        //
        //     res.status(500).json({
        //         success: false,
        //         error: message
        //     });
        // }
    }
};