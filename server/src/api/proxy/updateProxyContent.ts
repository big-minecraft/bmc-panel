import {ApiEndpoint, AuthType} from '../types';
import proxyService from "../../services/proxyService";
import {z} from "zod";

const updateProxyContentSchema = z.object({
    content: z.string().min(1),
}).strict();

export type UpdateProxyContentRequest = z.infer<typeof updateProxyContentSchema>;


export interface UpdateProxyContentResponse {
    message: string;
}

export const updateProxyContentEndpoint: ApiEndpoint<UpdateProxyContentRequest, UpdateProxyContentResponse> = {
    path: '/api/proxy/content',
    method: 'patch',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        // try {
        //     const data: UpdateProxyContentRequest = updateProxyContentSchema.parse(req.body);
        //     await proxyService.updateProxyContent(data.content);
        //
        //     res.json({
        //         success: true,
        //         data: {
        //             message: 'Proxy updated successfully',
        //         }
        //     });
        // } catch (error) {
        //     console.error('Failed to update proxy content:', error);
        //     let message: string = 'Failed to update proxy content';
        //
        //     res.status(500).json({
        //         success: false,
        //         error: message
        //     });
        // }
    }
};
