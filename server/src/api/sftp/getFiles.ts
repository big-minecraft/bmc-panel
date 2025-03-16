import {ApiEndpoint, AuthType} from '../types';
import SftpService from "../../services/sftpService";
import {DeploymentType} from "../../../../shared/enum/enums/deployment-type";

export interface GetFilesResponse {
    deploymentTypeIndex: number;
    files: any[];
}

export const getFilesEndpoint: ApiEndpoint<unknown, GetFilesResponse> = {
    path: '/api/sftp/files',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const path = req.query.path as string;
            
            const files = await SftpService.getInstance().listSFTPFiles(path);
            const deploymentType = SftpService.getInstance().getDeploymentType(path);
            
            res.json({
                success: true,
                data: {
                    deploymentTypeIndex: deploymentType ? deploymentType.getIndex() : -1,
                    files
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
