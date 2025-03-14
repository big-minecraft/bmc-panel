import mariadb from 'mariadb';
import ConfigManager from "../controllers/config/controllers/configManager";

class DatabaseService {
    private static instance: DatabaseService;
    public pool: mariadb.Pool;

    private constructor() {
        let config = ConfigManager.getConfig();

        this.pool = mariadb.createPool({
            host: config.mariadb.host,
            port: config.mariadb.port,
            user: config.mariadb.username,
            password: config.mariadb.password,
            database: config.mariadb.database,
            connectionLimit: 5
        });

        this.databaseInit();
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    private async databaseInit(): Promise<void> {
        try {
            await this.createTables();
            await this.checkAndCreateInitialInviteCode();
        } catch (error) {
            console.error('Failed to initialize database:', error);
        }
    }

    private async createTables(): Promise<void> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), secret VARCHAR(255), is_admin BOOLEAN DEFAULT FALSE, last_logout TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
            await conn.query('CREATE TABLE IF NOT EXISTS invite_codes (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(255), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, used_by VARCHAR(255) DEFAULT NULL)');
            await conn.query(`
                CREATE TABLE IF NOT EXISTS database_credentials (
                    database_name VARCHAR(64) PRIMARY KEY,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            await conn.query(`
                CREATE TABLE IF NOT EXISTS k8s_dash (
                token TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                PRIMARY KEY (token(768))
                )
            `);
        } catch (error) {
            console.error('Failed to create tables:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async userExists(username: string): Promise<boolean> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
            return rows.length > 0;
        } catch (error) {
            console.error('Failed to check if user exists:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async addUser(username: string, password: string, secret: string): Promise<void> {
        let users = await this.getUsers();
        let isAdmin = users.length === 0;

        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query('INSERT INTO users (username, password, secret, is_admin) VALUES (?, ?, ?, ?)', [username, password, secret, isAdmin]);
        } catch (error) {
            console.error('Failed to add user:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async getUsers(): Promise<any[]> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            return await conn.query('SELECT * FROM users');
        } catch (error) {
            console.error('Failed to get users:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async getUser(username: string): Promise<any> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
            return rows[0];
        } catch (error) {
            console.error('Failed to get user:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async getUserByID(userID: number): Promise<any> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            const rows = await conn.query('SELECT * FROM users WHERE id = ?', [userID]);
            return rows[0];
        } catch (error) {
            console.error('Failed to get user:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async getPassword(username: string): Promise<string> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            const rows = await conn.query('SELECT password FROM users WHERE username = ?', [username]);
            return rows[0].password;
        } catch (error) {
            console.error('Failed to get password:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async getInviteCodes(): Promise<any[]> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            const codes = await conn.query('SELECT * FROM invite_codes');

            return await Promise.all(codes.map(async (code: any) => {
                const isExpired = await this.isCodeExpired(code.code);
                return {
                    ...code,
                    is_expired: isExpired
                };
            }));
        } catch (error) {
            console.error('Failed to get invite codes:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async createInviteCode(message: string, code: string = Math.random().toString(36).substr(2)): Promise<void> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query('INSERT INTO invite_codes (code, message) VALUES (?, ?)', [code, message]);
        } catch (error) {
            console.error('Failed to create invite code:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async revokeInviteCode(code: string): Promise<void> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query('DELETE FROM invite_codes WHERE code = ?', [code]);
        } catch (error) {
            console.error('Failed to revoke invite code:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async verifyInviteCode(code: string): Promise<boolean> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            const rows = await conn.query('SELECT * FROM invite_codes WHERE code = ? AND used_by IS NULL', [code]);
            return rows.length > 0;
        } catch (error) {
            console.error('Failed to verify invite code:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async setInviteTokenUsed(code: string, username: string): Promise<void> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query('UPDATE invite_codes SET used_by = ? WHERE code = ?', [username, code]);
        } catch (error) {
            console.error('Failed to set invite token used:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async isCodeExpired(code: string): Promise<boolean> {
        let expiryDays = ConfigManager.getInt('invite-code-expiry-days');

        let conn;
        try {
            conn = await this.pool.getConnection();
            const rows = await conn.query('SELECT created_at FROM invite_codes WHERE code = ?', [code]);
            let created_at = rows[0].created_at;
            let expiryDate = new Date(created_at);
            expiryDate.setDate(expiryDate.getDate() + expiryDays);
            let now = new Date();
            return now > expiryDate;
        } catch (error) {
            console.error('Failed to check if code is expired:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async setAdmin(userID: number, isAdmin: boolean): Promise<void> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin, userID]);
        } catch (error) {
            console.error('Failed to set admin:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async resetPassword(userID: number, password: string): Promise<void> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query('UPDATE users SET password = ? WHERE id = ?', [password, userID]);
        } catch (error) {
            console.error('Failed to set password:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async deleteUser(userID: number): Promise<void> {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.query('DELETE FROM users WHERE id = ?', [userID]);
        } catch (error) {
            console.error('Failed to delete user:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async logout(username: string): Promise<void> {
        let conn;
        try {
            const currentTime = new Date();
            conn = await this.pool.getConnection();
            await conn.query('UPDATE users SET last_logout = ? WHERE username = ?', [currentTime, username]);
        } catch (error) {
            console.error('Failed to log out user:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    private async checkAndCreateInitialInviteCode(): Promise<void> {
        let users = await this.getUsers();
        let inviteCodes = await this.getInviteCodes();

        if (users.length === 0 && inviteCodes.length === 0) {
            let initialCode = process.env.INITIAL_INVITE_CODE;

            if (!initialCode) {
                console.error('No initial invite code found in environment variables');
                return;
            }

            await this.createInviteCode('Initial invite code', initialCode);
        }
    }
}

export default DatabaseService.getInstance();