import {pool} from './database';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

export async function getK8sDashboardToken() {
    let conn;
    try {
        conn = await pool.getConnection();
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
        console.error('failed to get k8s dashboard token:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

export async function createK8sDashboardToken() {
    let conn;
    try {
        conn = await pool.getConnection();

        const existingToken = await getK8sDashboardToken();
        if (existingToken) {
            throw new Error('valid token already exists');
        }

        const {stdout, stderr} = await execAsync('kubectl create token admin-user --duration=8760h');
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
        console.error('failed to create k8s dashboard token:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

export async function deleteK8sDashboardToken() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM k8s_dash');
    } catch (error) {
        console.error('failed to delete k8s dashboard token:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}