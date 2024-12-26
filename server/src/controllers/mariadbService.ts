import {pool} from './database';
import config from '../config';
import {PoolConnection} from 'mariadb';

async function createSqlDatabase(name: string) {
    let conn: PoolConnection;
    let databaseCreated = false;
    let userCreated = false;
    let credentialsInserted = false;

    try {
        if (!isValidDatabaseName(name)) {
            throw new Error('Invalid database name');
        }

        conn = await pool.getConnection();

        const [existingDatabases] = await conn.query(
            'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
            [name]
        );

        if (existingDatabases && existingDatabases.length > 0) {
            throw new Error(`Database '${name}' already exists`);
        }

        const username = `${name}_user`;
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

        const password = generatePassword();
        await conn.query(`CREATE USER ?@'%' IDENTIFIED BY ?`,
            [username, password]);
        userCreated = true;

        await conn.query(`GRANT ALL PRIVILEGES ON \`${name}\`.* TO ?@'%'`,
            [username]);

        await conn.query(
            `INSERT INTO bmc.database_credentials (database_name, password)
             VALUES (?, ?)`,
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
                    await conn.query(`DROP USER IF EXISTS ?@'%'`, [`${name}_user`]);
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

async function listSqlDatabases() {
    let conn;
    try {
        conn = await pool.getConnection();

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

        return databases.map(db => ({
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

async function deleteSqlDatabase(name) {
    let conn;
    try {
        if (!isValidDatabaseName(name)) {
            throw new Error('Invalid database name');
        }

        conn = await pool.getConnection();

        const username = `${name}_user`;
        await conn.query(`DROP USER IF EXISTS ?@'%'`, [username]);
        await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);

        await conn.query('DELETE FROM bmc.database_credentials WHERE database_name = ?',
            [name]);

        await conn.query('FLUSH PRIVILEGES');
    } catch (error) {
        throw new Error(`Failed to delete database: ${error.message}`);
    } finally {
        if (conn) await conn.end();
    }
}

async function resetSqlDatabasePassword(name) {
    let conn;
    try {
        if (!isValidDatabaseName(name)) {
            throw new Error('Invalid database name');
        }

        conn = await pool.getConnection();

        const username = `${name}_user`;
        const newPassword = generatePassword();

        await conn.query(`ALTER USER ?@'%' IDENTIFIED BY ?`,
            [username, newPassword]);

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

function generatePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

function isValidDatabaseName(name) {
    if (!name || typeof name !== 'string') return false;
    if (name.length === 0 || name.length > 64) return false;
    return /^[a-zA-Z0-9_]+$/.test(name);
}

export {
    createSqlDatabase,
    listSqlDatabases,
    deleteSqlDatabase,
    resetSqlDatabasePassword
}