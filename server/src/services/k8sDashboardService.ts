import { exec } from 'child_process';
import { promisify } from 'util';
import databaseService from "./databaseService";
import ConfigManager from "../controllers/config/controllers/configManager";

const execAsync = promisify(exec);

class K8sDashboardTokenManager {
    private static instance: K8sDashboardTokenManager;

    private constructor() {}

    public static getInstance(): K8sDashboardTokenManager {
        if (!K8sDashboardTokenManager.instance) {
            K8sDashboardTokenManager.instance = new K8sDashboardTokenManager();
        }
        return K8sDashboardTokenManager.instance;
    }

    public async getK8sDashboardToken(): Promise<string | null> {
        let conn;
        try {
            conn = await databaseService.pool.getConnection();
            const rows = await conn.query('SELECT * FROM k8s_dash');

            if (rows.length === 0) {
                return null;
            }

            const token = rows[0];
            const now = new Date();

            if (now > token.expires_at) {
                await conn.query('DELETE FROM k8s_dash');
                return null;
            }

            return token.token;
        } catch (error) {
            console.error('Failed to get k8s dashboard token:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async createK8sDashboardToken(): Promise<string> {
        let conn;
        try {
            conn = await databaseService.pool.getConnection();

            const existingToken = await this.getK8sDashboardToken();
            if (existingToken) {
                throw new Error('Valid token already exists');
            }

            const { stdout, stderr } = await execAsync('kubectl create token admin-user --duration=8760h');
            if (stderr) {
                throw new Error(`kubectl error: ${stderr}`);
            }

            const token = stdout.trim();
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 8760);

            await conn.query(
                'INSERT INTO k8s_dash (token, expires_at) VALUES (?, ?)',
                [token, expiryDate]
            );

            return token;
        } catch (error) {
            console.error('Failed to create k8s dashboard token:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public async deleteK8sDashboardToken(): Promise<void> {
        let conn;
        try {
            conn = await databaseService.pool.getConnection();
            await conn.query('DELETE FROM k8s_dash');
        } catch (error) {
            console.error('Failed to delete k8s dashboard token:', error);
            throw error;
        } finally {
            if (conn) await conn.end();
        }
    }

    public getK8sDashboardHost() {
        return ConfigManager.getString("k8s-dashboard-host");
    }
}

export default K8sDashboardTokenManager.getInstance();