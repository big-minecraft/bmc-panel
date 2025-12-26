import ConfigManager from "../features/config/controllers/configManager";
import DatabaseService from "./databaseService";

class InviteCodeService {
    private tokens: { [code: string]: string } = {};
    private static instance: InviteCodeService;

    private constructor() {}

    public static getInstance(): InviteCodeService {
        return InviteCodeService.instance;
    }

    public static init(): void {
        InviteCodeService.instance = new InviteCodeService();
    }

    async verifyInvite(code: string): Promise<string> {
        const environment = ConfigManager.getConfig().environment;

        if (environment === 'production') {
            if (await DatabaseService.getInstance().isCodeExpired(code)) throw new Error('Invite code expired');
            const verified = await DatabaseService.getInstance().verifyInviteCode(code);
            if (!verified) throw new Error('Invalid invite code');
        }

        const token = Math.random().toString(36).substr(2);
        this.tokens[code] = token;

        return token;
    }

    checkToken(token: string): boolean {
        return Object.values(this.tokens).includes(token);
    }

    removeToken(token: string): void {
        for (const code in this.tokens) {
            if (this.tokens[code] === token) {
                delete this.tokens[code];
                return;
            }
        }
    }

    getCode(token: string): string | null {
        for (const code in this.tokens) {
            if (this.tokens[code] === token) {
                return code;
            }
        }
        return null;
    }

    getTokens(): { [code: string]: string } {
        return this.tokens;
    }
}

export default InviteCodeService;