import {ApiEndpoint, AuthType} from '../types';
import AuthService from "../../services/authService";
import OidcService from "../../services/oidcService";

const ERROR_CODES: Record<string, string> = {
    'Not a member of the required group': 'oidc_not_authorized',
    'No panel account exists for this user': 'oidc_no_account',
    'Username is already linked to another identity': 'oidc_username_taken',
};

export const oidcCallbackEndpoint: ApiEndpoint<unknown, unknown> = {
    path: '/api/auth/oidc/callback',
    method: 'get',
    auth: AuthType.None,
    handler: async (req, res) => {
        const oidcService = OidcService.getInstance();

        if (!oidcService.isEnabled()) {
            res.redirect('/login?error=oidc_disabled');
            return;
        }

        if (req.query.error) {
            console.error(`[oidc] provider returned error: ${req.query.error} ${req.query.error_description || ''}`);
            res.redirect('/login?error=oidc_denied');
            return;
        }

        try {
            const params = req.query as Record<string, string>;
            const {profile, returnTo} = await oidcService.handleCallback(params);
            const {token, isAdmin} = await AuthService.getInstance().oidcLogin(profile);

            console.log(`[oidc] login succeeded for ${profile.username} (admin: ${isAdmin})`);

            const fragment = new URLSearchParams({
                token,
                isAdmin: String(isAdmin),
                returnTo,
            });
            res.redirect(`/auth/callback#${fragment.toString()}`);
        } catch (error) {
            console.error('[oidc] callback failed:', error.message);
            const code = ERROR_CODES[error.message] || 'oidc_failed';
            res.redirect(`/login?error=${code}`);
        }
    }
};
