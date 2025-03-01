import {ApiEndpoint, AuthType} from '../types';
import DeploymentManager from "../../features/deployments/controllers/deploymentManager";
import {Instance} from "../../../../shared/model/instance";
import {MinecraftInstance} from "../../../../shared/model/minecraft-instance";

export interface GetDeploymentInstancesResponse {
    instances: Instance[];
}

export const getDeploymentInstancesEndpoint: ApiEndpoint<unknown, GetDeploymentInstancesResponse> = {
    path: '/api/deployments/:name/instances',
    method: 'get',
    auth: AuthType.Basic,
    handler: async (req, res) => {
        try {
            const name = req.params.name as string;

            const deploymentInstance = DeploymentManager.getDeploymentByName(name);
            const instances = await deploymentInstance.getInstances();

            const serializedInstances = instances.map(instance => {
                if (instance instanceof MinecraftInstance) {
                    return {
                        ...instance,
                        players: Object.fromEntries(instance.players)
                    };
                }

                return instance;
            });

            res.json({
                success: true,
                data: {
                    instances: serializedInstances
                },
            });
        } catch (error) {
            console.error('Failed to fetch deployment instances:', error);
            let message: string = 'Failed to fetch deployment instances';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    }
};