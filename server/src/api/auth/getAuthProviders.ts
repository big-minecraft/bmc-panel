import {ApiEndpoint, AuthType} from '../types';
import OidcService from "../../services/oidcService";

export interface AuthProvidersResponse {
    localLogin: boolean;
    oidc: {
        enabled: boolean;
        displayName: string;
    };
}

export const getAuthProvidersEndpoint: ApiEndpoint<unknown, AuthProvidersResponse> = {
    path: '/api/auth/providers',
    method: 'get',
    auth: AuthType.None,
    handler: async (_req, res) => {
        const oidcService = OidcService.getInstance();

        res.json({
            success: true,
            data: {
                localLogin: oidcService.allowsLocalLogin(),
                oidc: {
                    enabled: oidcService.isEnabled(),
                    displayName: oidcService.getDisplayName(),
                }
            }
        });
    }
};
