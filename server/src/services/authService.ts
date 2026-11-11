import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import {join} from "path";
import {writeFileSync} from "fs";
import AppConfig from "../features/config/models/appConfig";
import ConfigManager from "../features/config/controllers/configManager";
import DatabaseService from "./databaseService";
import InviteCodeService from "./inviteCodeService";
import OidcService, {OidcProfile} from "./oidcService";

interface UserSecret {
    password: string;
    secret: string;
}

interface TempToken {
    secret: string;
}

class AuthService {
    private readonly users: Record<string, UserSecret>;
    private readonly tempTokens: Record<string, TempToken>;

    private static instance: AuthService;

    private constructor() {
        this.users = {};
        this.tempTokens = {};

        AuthService.instance = this;
    }

    public async register(username: string, password: string, inviteToken: string): Promise<string> {
        if (!OidcService.getInstance().allowsLocalLogin()) throw new Error('Password registration is disabled');
        if (await DatabaseService.getInstance().userExists(username)) throw new Error('User already exists');
        if (!InviteCodeService.getInstance().checkToken(inviteToken)) throw new Error('Invalid invite token');

        const secret = speakeasy.generateSecret({
            length: 20,
            name: `Big Minecraft (${username})`,
            issuer: 'Big Minecraft'
        });
        this.users[username] = {password, secret: secret.base32};

        return await new Promise<string>((resolve, reject) => {
            qrcode.toDataURL(secret.otpauth_url, (err: Error | null, data_url: string) => {
                if (err) reject(err);
                else resolve(data_url);
            });
        });
    }

    public async verifyRegistration(username: string, token: string, inviteToken: string): Promise<string> {
        const user = this.users[username];

        if (!InviteCodeService.getInstance().checkToken(inviteToken)) throw new Error('Invalid invite token');
        if (!user) throw new Error('User not found');

        const verified = speakeasy.totp.verify({
            secret: user.secret,
            encoding: 'base32',
            token
        });

        const environment = ConfigManager.getConfig().environment;

        if (verified || environment === 'development') {
            delete this.users[username];
            await DatabaseService.getInstance().addUser(username, user.password, user.secret);
        }

        if (!verified && environment === "production") throw new Error('Invalid token');
        let inviteCodeService = InviteCodeService.getInstance();

        await DatabaseService.getInstance().setInviteTokenUsed(inviteCodeService.getCode(inviteToken), username);
        inviteCodeService.removeToken(inviteToken);

        return await this.generateToken(username);
    }

    public async login(username: string, password: string): Promise<string> {
        if (!OidcService.getInstance().allowsLocalLogin()) throw new Error('Password login is disabled');
        if (!(await DatabaseService.getInstance().userExists(username))) throw new Error('User not found');

        const dbUser = await DatabaseService.getInstance().getUser(username);
        if (dbUser.auth_provider && dbUser.auth_provider !== 'local') {
            throw new Error('This account signs in through your identity provider');
        }

        const storedPassword = await DatabaseService.getInstance().getPassword(username);
        if (password !== storedPassword) throw new Error('Invalid password');

        const token = Math.random().toString(36).substr(2);
        this.tempTokens[username] = {secret: token};
        return this.tempTokens[username].secret;
    }

    public async verifyLogin(username: string, token: string, sessionToken: string): Promise<string> {
        if (!sessionToken) throw new Error('Session token not found');

        const tempToken = this.tempTokens[username];

        if (!tempToken) throw new Error('User not found');
        if (tempToken.secret !== sessionToken) throw new Error('Invalid session token');

        const user = await DatabaseService.getInstance().getUser(username);
        const secret = user.secret;

        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token
        });

        const environment = ConfigManager.getConfig().environment;
        if (!verified && environment === "production") throw new Error('Invalid token');

        return await this.generateToken(username);
    }

    public async oidcLogin(profile: OidcProfile): Promise<{ token: string, isAdmin: boolean }> {
        const config = ConfigManager.getConfig();
        const oidc = config.oidc;
        const provider = 'oidc';

        if (oidc.allowedGroup && !profile.groups.includes(oidc.allowedGroup)) {
            throw new Error('Not a member of the required group');
        }

        const database = DatabaseService.getInstance();
        let user = await database.getUserByExternalId(provider, profile.subject);

        if (user) {
            if (user.username !== profile.username) {
                await database.setUserUsername(user.id, profile.username);
                user = {...user, username: profile.username};
            }
        } else {
            const existing = await database.userExists(profile.username)
                ? await database.getUser(profile.username) : null;

            if (existing) {
                if (existing.auth_provider && existing.auth_provider !== 'local') {
                    throw new Error('Username is already linked to another identity');
                }

                await database.linkUserToProvider(existing.id, provider, profile.subject);
                user = {...existing, auth_provider: provider, external_id: profile.subject};
            } else {
                if (oidc.autoCreateUsers === false) throw new Error('No panel account exists for this user');

                const isAdmin = Boolean(oidc.adminGroup && profile.groups.includes(oidc.adminGroup));
                await database.addExternalUser(profile.username, provider, profile.subject, isAdmin);
                user = await database.getUserByExternalId(provider, profile.subject);
            }
        }

        if (oidc.adminGroup) {
            const shouldBeAdmin = profile.groups.includes(oidc.adminGroup);
            if (Boolean(user.is_admin) !== shouldBeAdmin) {
                await database.setUserAdminByUsername(user.username, shouldBeAdmin);
                user = {...user, is_admin: shouldBeAdmin};
            }
        }

        return {
            token: await this.generateToken(user.username),
            isAdmin: Boolean(user.is_admin),
        };
    }

    private async generateToken(username: string): Promise<string> {
        const payload = {username: username};
        const options = {expiresIn: "7d"};

        return jwt.sign(payload, ConfigManager.getConfig().panel.panelSecret, options);
    }

    public static getInstance(): AuthService {
        return AuthService.instance;
    }

    public static init(): void {
        AuthService.instance = new AuthService();
    }
}

export default AuthService;