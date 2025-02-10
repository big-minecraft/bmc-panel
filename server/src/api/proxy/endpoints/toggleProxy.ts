import {ApiEndpoint, AuthType} from '../../types';
import {z} from 'zod';
import proxyService from "../../../services/proxyService";

const toggleProxySchema = z.object({
    enabled: z.boolean(),
}).strict();

export type ToggleProxyRequest = z.infer<typeof toggleProxySchema>;

export interface ToggleProxyResponse {
    message: string;
}

export const toggleProxyEndpoint: ApiEndpoint<ToggleProxyRequest, ToggleProxyResponse> = {
    path: '/api/proxy/toggle',
    method: 'post',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const data: ToggleProxyRequest = toggleProxySchema.parse(req.body);

            await proxyService.toggleProxy(data.enabled);
            
            res.json({
                success: true,
                data: {
                    message: 'Proxy toggled successfully',
                }
            });
        } catch (error) {
            console.error('Failed to toggle proxy:', error);
            let message: string = 'Failed to toggle proxy';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};