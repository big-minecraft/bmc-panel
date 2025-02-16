import config from '../config';
import { PoolConnection } from 'mariadb';
import databaseService from "./databaseService";
import {createReadStream, createWriteStream} from "node:fs";
import * as readline from "node:readline";

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
        const username = `${name}_user`;

        try {
            if (!this.isValidDatabaseName(name)) {
                throw new Error('Invalid database name');
            }

            conn = await databaseService.pool.getConnection();

            const existingDatabases = await conn.query(
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
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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

    async backup(databaseName: string): Promise<string> {
        let connection: PoolConnection | null = null;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `backup-${databaseName}-${timestamp}.sql`;
        const writeStream = createWriteStream(backupPath);

        try {
            connection = await databaseService.pool.getConnection();

            const tables = await connection.query(
                'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
                [databaseName]
            );

            if (!Array.isArray(tables) || tables.length === 0) {
                throw new Error(`Database '${databaseName}' has no tables`);
            }

            writeStream.write(`USE \`${databaseName}\`;\n\n`);

            for (const table of tables) {
                const tableName = table.TABLE_NAME;

                if (!tableName) {
                    console.warn('Skipping invalid table entry:', table);
                    continue;
                }

                const createTableResult = await connection.query(
                    `SHOW CREATE TABLE \`${databaseName}\`.\`${tableName}\``
                );

                if (!createTableResult?.[0]?.['Create Table']) {
                    console.warn(`Could not get creation SQL for table: ${tableName}`);
                    continue;
                }

                writeStream.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
                writeStream.write(`${createTableResult[0]['Create Table']};\n\n`);

                const rows = await connection.query(
                    `SELECT * FROM \`${databaseName}\`.\`${tableName}\``
                );

                if (Array.isArray(rows) && rows.length > 0) {
                    const chunkSize = 1000;
                    for (let i = 0; i < rows.length; i += chunkSize) {
                        const chunk = rows.slice(i, i + chunkSize);
                        const columns = Object.keys(chunk[0]);

                        const values = chunk.map(row =>
                            `(${columns.map(col => {
                                const value = row[col];
                                return connection!.escape(value);
                            }).join(', ')})`
                        ).join(',\n');

                        writeStream.write(
                            `INSERT INTO \`${tableName}\` ` +
                            `(\`${columns.join('`, `')}\`) VALUES\n` +
                            `${values};\n`
                        );
                    }
                    writeStream.write('\n');
                }
            }

            await new Promise<void>((resolve) => writeStream.end(resolve));
            console.log(`Backup created: ${backupPath}`);
            return backupPath;

        } catch (error) {
            console.error('Backup failed:', error);
            writeStream.end();
            throw error;
        } finally {
            if (connection) {
                await connection.release();
            }
        }
    }

    async restore(backupPath: string): Promise<void> {
        let connection: PoolConnection | null = null;
        try {
            connection = await databaseService.pool.getConnection();

            const match = backupPath.match(/backup-(.+?)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.sql/);
            if (!match) {
                throw new Error('Could not determine database name from backup file.');
            }
            const databaseName = match[1];

            const dbExists = await connection.query(
                'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
                [databaseName]
            );

            if (!Array.isArray(dbExists) || dbExists.length === 0) {
                await this.createSqlDatabase(databaseName);
                console.log(`Database '${databaseName}' created.`);
            }

            await connection.query(`USE \`${databaseName}\``);

            const fileStream = createReadStream(backupPath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            let currentStatement = '';

            for await (const line of rl) {
                if (!line || line.startsWith('--')) continue;

                currentStatement += line;

                if (line.trim().endsWith(';')) {
                    try {
                        await connection.query(currentStatement);
                        currentStatement = '';
                    } catch (error) {
                        console.error('Error executing statement:', currentStatement);
                        throw error;
                    }
                }
            }

            console.log('Database restore completed successfully');

        } catch (error) {
            console.error('Restore failed:', error);
            throw error;
        } finally {
            if (connection) {
                await connection.release();
            }
        }
    }
}

export default MariadbService.getInstance();