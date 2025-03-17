import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import {join} from "path";
import {writeFileSync} from "fs";
import AppConfig from "../features/config/models/appConfig";
import ConfigManager from "../features/config/controllers/configManager";
import DatabaseService from "./databaseService";
import InviteCodeService from "./inviteCodeService";

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
        if (!(await DatabaseService.getInstance().userExists(username))) throw new Error('User not found');

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

    private async generateToken(username: string): Promise<string> {
        const payload = {username: username};
        const options = {expiresIn: "7d"};

        return jwt.sign(payload, ConfigManager.getString("panel-secret"), options);
    }

    public static getInstance(): AuthService {
        return AuthService.instance;
    }

    public static init(): void {
        AuthService.instance = new AuthService();
    }
}

export default AuthService;