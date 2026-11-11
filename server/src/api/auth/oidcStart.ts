import {ApiEndpoint, AuthType} from '../types';
import OidcService from "../../services/oidcService";

export const oidcStartEndpoint: ApiEndpoint<unknown, unknown> = {
    path: '/api/auth/oidc/start',
    method: 'get',
    auth: AuthType.None,
    handler: async (req, res) => {
        const oidcService = OidcService.getInstance();

        if (!oidcService.isEnabled()) {
            res.redirect('/login?error=oidc_disabled');
            return;
        }

        try {
            const returnTo = sanitizeReturnTo(req.query.returnTo);
            const url = await oidcService.getAuthorizationUrl(returnTo);
            res.redirect(url);
        } catch (error) {
            console.error('[oidc] failed to start login:', error.message);
            res.redirect('/login?error=oidc_unavailable');
        }
    }
};

export const sanitizeReturnTo = (value: unknown): string => {
    if (typeof value !== 'string' || !value.startsWith('/')) return '/';
    if (value.startsWith('//')) return '/';
    if (value.startsWith('/\\')) return '/';
    return value;
};