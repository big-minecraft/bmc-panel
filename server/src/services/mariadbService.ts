import config from '../config';
import { PoolConnection } from 'mariadb';
import databaseService from "./databaseService";

interface DatabaseCredentials {
    username: string;
    password: string;
}

export interface DatabaseInfo {
    name: string;
    size: string;
    tables: number;
    credentials: {
        username: string;
        password: string;
        host: string;
        port: number;
    };
}

class MariadbService {
    private static instance: MariadbService;

    private constructor() {}

    public static getInstance(): MariadbService {
        if (!MariadbService.instance) {
            MariadbService.instance = new MariadbService();
        }
        return MariadbService.instance;
    }

    public async createSqlDatabase(name: string): Promise<{ name: string; credentials: DatabaseCredentials }> {
        let conn: PoolConnection | undefined;
        let databaseCreated = false;
        let userCreated = false;
        let credentialsInserted = false;
        const username = `${name}_user`; // Define username here for cleanup

        try {
            if (!this.isValidDatabaseName(name)) {
                throw new Error('Invalid database name');
            }

            conn = await databaseService.pool.getConnection();

            const [existingDatabases] = await conn.query(
                'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
                [name]
            );

            if (existingDatabases && existingDatabases.length > 0) {
                throw new Error(`Database '${name}' already exists`);
            }

            const [existingUsers] = await conn.query(
                'SELECT User FROM mysql.user WHERE User = ?',
                [username]
            );

            if (existingUsers && existingUsers.length > 0) {
                throw new Error(`User '${username}' already exists`);
            }

            const [existingCredentials] = await conn.query(
                'SELECT database_name FROM bmc.database_credentials WHERE database_name = ?',
                [name]
            );

            if (existingCredentials && existingCredentials.length > 0) {
                throw new Error(`Credentials for database '${name}' already exist`);
            }

            await conn.query(`CREATE DATABASE \`${name}\``);
            databaseCreated = true;

            const password = this.generatePassword();
            await conn.query(`CREATE USER ?@'%' IDENTIFIED BY ?`, [username, password]);
            userCreated = true;

            await conn.query(`GRANT ALL PRIVILEGES ON \`${name}\`.* TO ?@'%'`, [username]);

            await conn.query(
                `INSERT INTO bmc.database_credentials (database_name, password) VALUES (?, ?)`,
                [name, password]
            );
            credentialsInserted = true;

            await conn.query('FLUSH PRIVILEGES');

            return {
                name,
                credentials: {
                    username,
                    password
                }
            };
        } catch (error) {
            try {
                if (conn) {
                    if (credentialsInserted) {
                        await conn.query(
                            'DELETE FROM bmc.database_credentials WHERE database_name = ?',
                            [name]
                        );
                    }
                    if (userCreated) {
                        await conn.query(`DROP USER IF EXISTS ?@'%'`, [username]);
                    }
                    if (databaseCreated) {
                        await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
                    }
                    await conn.query('FLUSH PRIVILEGES');
                }
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }
            throw new Error(`Failed to create database: ${error.message}`);
        } finally {
            if (conn) await conn.end();
        }
    }

    public async listSqlDatabases(): Promise<DatabaseInfo[]> {
        let conn: PoolConnection | undefined;
        try {
            conn = await databaseService.pool.getConnection();

            const databases = await conn.query(`
                SELECT
                    s.schema_name as name,
                    ROUND(SUM(t.data_length + t.index_length) / 1024 / 1024, 2) as size,
                    COUNT(t.table_name) as tables,
                    c.password
                FROM information_schema.schemata s
                    LEFT JOIN information_schema.tables t
                ON t.table_schema = s.schema_name
                    LEFT JOIN bmc.database_credentials c
                    ON c.database_name = s.schema_name
                WHERE s.schema_name NOT IN (
                    'information_schema', 'mysql',
                    'performance_schema', 'sys',
                    'bmc'
                    )
                GROUP BY s.schema_name
            `);

            return databases.map((db: any) => ({
                name: db.name,
                size: `${db.size || 0}MB`,
                tables: db.tables || 0,
                credentials: {
                    username: `${db.name}_user`,
                    password: db.password,
                    host: config['panel-host'],
                    port: 30036
                }
            }));
        } catch (error) {
            throw new Error(`Failed to list databases: ${error.message}`);
        } finally {
            if (conn) await conn.end();
        }
    }

    public async deleteSqlDatabase(name: string): Promise<void> {
        let conn: PoolConnection | undefined;
        try {
            if (!this.isValidDatabaseName(name)) {
                throw new Error('Invalid database name');
            }

            conn = await databaseService.pool.getConnection();

            const username = `${name}_user`;
            await conn.query(`DROP USER IF EXISTS ?@'%'`, [username]);
            await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);

            await conn.query(
                'DELETE FROM bmc.database_credentials WHERE database_name = ?',
                [name]
            );

            await conn.query('FLUSH PRIVILEGES');
        } catch (error) {
            throw new Error(`Failed to delete database: ${error.message}`);
        } finally {
            if (conn) await conn.end();
        }
    }

    public async resetSqlDatabasePassword(name: string): Promise<DatabaseCredentials> {
        let conn: PoolConnection | undefined;
        try {
            if (!this.isValidDatabaseName(name)) {
                throw new Error('Invalid database name');
            }

            conn = await databaseService.pool.getConnection();

            const username = `${name}_user`;
            const newPassword = this.generatePassword();

            await conn.query(`ALTER USER ?@'%' IDENTIFIED BY ?`, [username, newPassword]);

            await conn.query(
                'UPDATE bmc.database_credentials SET password = ? WHERE database_name = ?',
                [newPassword, name]
            );

            await conn.query('FLUSH PRIVILEGES');

            return {
                username,
                password: newPassword
            };
        } catch (error) {
            throw new Error(`Failed to reset password: ${error.message}`);
        } finally {
            if (conn) await conn.end();
        }
    }

    private generatePassword(): string {
        const length = 16;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    }

    private isValidDatabaseName(name: string): boolean {
        if (!name || typeof name !== 'string') return false;
        if (name.length === 0 || name.length > 64) return false;
        return /^[a-zA-Z0-9_]+$/.test(name);
    }
}

export default MariadbService.getInstance();