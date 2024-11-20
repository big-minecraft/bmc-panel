const { pool } = require('./database.js');

async function createDatabase(name) {
    let conn;
    try {
        if (!isValidDatabaseName(name)) {
            throw new Error('Invalid database name');
        }

        conn = await pool.getConnection();

        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\``);

        const username = `${name}_user`;
        const password = generatePassword();

        await conn.query(`CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?`,
            [username, password]);

        await conn.query(`GRANT ALL PRIVILEGES ON \`${name}\`.* TO ?@'%'`,
            [username]);

        await conn.query(
            `INSERT INTO bmc.database_credentials (database_name, password) 
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password)`,
            [name, password]
        );

        await conn.query('FLUSH PRIVILEGES');

        return {
            name,
            credentials: {
                username,
                password
            }
        };
    } catch (error) {
        throw new Error(`Failed to create database: ${error.message}`);
    } finally {
        if (conn) await conn.end();
    }
}

async function listDatabases() {
    let conn;
    try {
        conn = pool.getConnection();

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
                password: db.password
            }
        }));
    } catch (error) {
        throw new Error(`Failed to list databases: ${error.message}`);
    } finally {
        if (conn) await conn.end();
    }
}

async function deleteDatabase(name) {
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

async function resetDatabasePassword(name) {
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
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map(x => charset[x % charset.length])
        .join('');
}

function isValidDatabaseName(name) {
    if (!name || typeof name !== 'string') return false;
    if (name.length === 0 || name.length > 64) return false;
    return /^[a-zA-Z0-9_]+$/.test(name);
}

module.exports = {
    createDatabase,
    listDatabases,
    deleteDatabase,
    resetDatabasePassword
}