import {ApiEndpoint, AuthType} from '../types';
import SftpService from "../../services/sftpService";
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";
import {DeploymentType} from "../../../../shared/enum/enums/deployment-type";

export interface GetFilesResponse {
    files: any[];
    deploymentType: string | null;
}

export const getFilesEndpoint: ApiEndpoint<unknown, GetFilesResponse> = {
    path: '/api/sftp/files',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const path = req.query.path as string;

            let deployment = DeploymentManager.getDeploymentByPath(path);
            const files = await SftpService.getInstance().listSFTPFiles(path);
            
            res.json({
                success: true,
                data: {
                    files: files,
                    deploymentType: deployment ? deployment.type.identifier : null
                }
            });
        } catch (error) {
            console.error('Failed to list files:', error);
            let message: string = 'Failed to list files';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};
