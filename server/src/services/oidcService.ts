import {Client, Issuer, generators} from 'openid-client';
import ConfigManager from "../features/config/controllers/configManager";

interface PendingAuth {
    codeVerifier: string;
    nonce: string;
    returnTo: string;
    createdAt: number;
}

export interface OidcProfile {
    subject: string;
    username: string;
    email: string | null;
    groups: string[];
}

const PENDING_TTL_MS = 10 * 60 * 1000;
const DEFAULT_SCOPES = 'openid profile email';
const CALLBACK_PATH = '/api/auth/oidc/callback';

class OidcService {
    private static instance: OidcService;

    private readonly pending: Record<string, PendingAuth>;
    private client: Client | null;
    private discovery: Promise<Client> | null;

    private constructor() {
        this.pending = {};
        this.client = null;
        this.discovery = null;
    }

    public isEnabled(): boolean {
        const oidc = ConfigManager.getConfig().oidc;
        return Boolean(oidc?.enabled);
    }

    public allowsLocalLogin(): boolean {
        const oidc = ConfigManager.getConfig().oidc;
        if (!oidc?.enabled) return true;
        return oidc.allowLocalLogin !== false;
    }

    public getDisplayName(): string {
        return ConfigManager.getConfig().oidc?.displayName || 'Single Sign-On';
    }

    public getRedirectUri(): string {
        const configured = ConfigManager.getConfig().oidc?.redirectUri;
        if (configured) return configured;

        return `${this.getPanelBaseUrl()}${CALLBACK_PATH}`;
    }

    private getPanelBaseUrl(): string {
        const config = ConfigManager.getConfig();
        const host = config.ingress?.host || config.panel?.panelHost;
        if (!host) throw new Error('Cannot derive the panel URL: set oidc.redirectUri or ingress.host');

        return `https://${host}`;
    }

    private getScopes(): string {
        return ConfigManager.getConfig().oidc?.scopes || DEFAULT_SCOPES;
    }

    private async getClient(): Promise<Client> {
        if (this.client) return this.client;
        if (this.discovery) return this.discovery;

        const oidc = ConfigManager.getConfig().oidc;
        if (!oidc?.enabled) throw new Error('OIDC is not enabled');

        this.discovery = (async () => {
            console.log(`[OidcService] discovering issuer ${oidc.issuer}`);
            const issuer = await Issuer.discover(oidc.issuer);
            console.log(`[OidcService] discovered ${issuer.issuer}`);

            const client = new issuer.Client({
                client_id: oidc.clientId,
                client_secret: oidc.clientSecret,
                redirect_uris: [this.getRedirectUri()],
                response_types: ['code'],
            });

            this.client = client;
            return client;
        })();

        try {
            return await this.discovery;
        } catch (error) {
            this.discovery = null;
            throw error;
        }
    }

    public async getAuthorizationUrl(returnTo: string): Promise<string> {
        const client = await this.getClient();

        const state = generators.state();
        const nonce = generators.nonce();
        const codeVerifier = generators.codeVerifier();

        this.prunePending();
        this.pending[state] = {codeVerifier, nonce, returnTo, createdAt: Date.now()};

        return client.authorizationUrl({
            scope: this.getScopes(),
            state,
            nonce,
            code_challenge: generators.codeChallenge(codeVerifier),
            code_challenge_method: 'S256',
        });
    }

    public async handleCallback(params: Record<string, string>): Promise<{ profile: OidcProfile, returnTo: string }> {
        const state = params.state;
        if (!state) throw new Error('Missing state');

        const pending = this.pending[state];
        if (!pending) throw new Error('Unknown or expired state');
        delete this.pending[state];

        if (Date.now() - pending.createdAt > PENDING_TTL_MS) throw new Error('Login attempt expired');

        const client = await this.getClient();

        const tokenSet = await client.callback(this.getRedirectUri(), params, {
            state,
            nonce: pending.nonce,
            code_verifier: pending.codeVerifier,
        });

        const claims = tokenSet.claims();
        const oidc = ConfigManager.getConfig().oidc;

        const usernameClaim = oidc.usernameClaim || 'preferred_username';
        const groupsClaim = oidc.groupsClaim || 'groups';

        let groups = this.readGroups(claims[groupsClaim]);
        let username = claims[usernameClaim] as string;
        let email = (claims.email as string) || null;

        const needsGroups = Boolean(oidc.allowedGroup || oidc.adminGroup) && groups === null;
        if (!username || needsGroups) {
            const userinfo = await client.userinfo(tokenSet);
            username = username || userinfo[usernameClaim] as string;
            email = email || (userinfo.email as string) || null;
            if (groups === null) groups = this.readGroups(userinfo[groupsClaim]);
        }

        if (!claims.sub) throw new Error('Provider returned no subject claim');
        if (!username) throw new Error(`Provider returned no "${usernameClaim}" claim`);

        return {
            profile: {
                subject: claims.sub,
                username,
                email,
                groups: groups || [],
            },
            returnTo: pending.returnTo,
        };
    }

    public async getEndSessionUrl(): Promise<string | null> {
        const oidc = ConfigManager.getConfig().oidc;
        if (!oidc?.enabled || !oidc.endSessionOnLogout) return null;

        try {
            const client = await this.getClient();
            if (!client.issuer.metadata.end_session_endpoint) return null;

            return client.endSessionUrl({
                post_logout_redirect_uri: `${this.getPanelBaseUrl()}/login`,
            });
        } catch (error) {
            console.error('[OidcService] failed to build end session url:', error.message);
            return null;
        }
    }

    private readGroups(value: unknown): string[] | null {
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === 'string') return value.split(/[\s,]+/).filter(Boolean);
        return null;
    }

    private prunePending(): void {
        const cutoff = Date.now() - PENDING_TTL_MS;
        for (const state of Object.keys(this.pending)) {
            if (this.pending[state].createdAt < cutoff) delete this.pending[state];
        }
    }

    public static getInstance(): OidcService {
        return OidcService.instance;
    }

    public static init(): void {
        OidcService.instance = new OidcService();

        const oidc = ConfigManager.getConfig().oidc;
        if (!oidc?.enabled) {
            console.log('[OidcService] OIDC is disabled');
            return;
        }

        const missing = ['issuer', 'clientId', 'clientSecret'].filter(key => !oidc[key]);
        if (missing.length) {
            console.error(`[OidcService] OIDC is enabled but missing required config: ${missing.join(', ')}`);
        }

        const scopes = OidcService.instance.getScopes();
        if ((oidc.allowedGroup || oidc.adminGroup) && !scopes.split(/\s+/).includes('groups')) {
            console.warn(
                '[OidcService] allowedGroup/adminGroup is set but the "groups" scope is not requested. ' +
                'Add "groups" to oidc.scopes and attach the groups scope mapping to the provider.'
            );
        }

        console.log(`[OidcService] OIDC enabled, redirect uri: ${OidcService.instance.getRedirectUri()}`);
        if (!OidcService.instance.allowsLocalLogin()) {
            console.log('[OidcService] local password login is disabled');
        }
    }
}

export default OidcService;
