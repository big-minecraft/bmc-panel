const config = require('../config');
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: config.mariadb.host,
    port: config.mariadb.port,
    user: config.mariadb.username,
    password: config.mariadb.password,
    database: config.mariadb.database,
    connectionLimit: 5
});

async function databaseInit() {
    try {
        await createTables();
        await checkAndCreateInitialInviteCode();
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
}

async function createTables() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), secret VARCHAR(255), is_admin BOOLEAN DEFAULT FALSE, last_logout TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        await conn.query('CREATE TABLE IF NOT EXISTS invite_codes (id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(255), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, used_by VARCHAR(255) DEFAULT NULL)');
    } catch (error) {
        console.error('Failed to create tables:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function userExists(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows.length > 0;
    } catch (error) {
        console.error('Failed to check if user exists:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function addUser(username, password, secret) {
    let users = await getUsers();
    let isAdmin = users.length === 0;

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('INSERT INTO users (username, password, secret, is_admin) VALUES (?, ?, ?, ?)', [username, password, secret, isAdmin]);
    } catch (error) {
        console.error('Failed to add user:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function getUsers() {
    let conn;
    try {
        conn = await pool.getConnection();
        return await conn.query('SELECT * FROM users');
    } catch (error) {
        console.error('Failed to get users:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function getUser(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    } catch (error) {
        console.error('Failed to get user:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function getUserByID(userID) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM users WHERE id = ?', [userID]);
        return rows[0];
    } catch (error) {
        console.error('Failed to get user:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function getPassword(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT password FROM users WHERE username = ?', [username]);
        return rows[0].password;
    } catch (error) {
        console.error('Failed to get password:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function getInviteCodes() {
    let conn;
    try {
        conn = await pool.getConnection();
        const codes = await conn.query('SELECT * FROM invite_codes');

        return await Promise.all(codes.map(async (code) => {
            const isExpired = await isCodeExpired(code.code);
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

async function createInviteCode(message, code=Math.random().toString(36).substr(2)) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('INSERT INTO invite_codes (code, message) VALUES (?, ?)', [code, message]);
    } catch (error) {
        console.error('Failed to create invite code:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function revokeInviteCode(code) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM invite_codes WHERE code = ?', [code]);
    } catch (error) {
        console.error('Failed to revoke invite code:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function verifyInviteCode(code) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM invite_codes WHERE code = ? AND used_by IS NULL', [code]);
        return rows.length > 0;
    } catch (error) {
        console.error('Failed to verify invite code:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function setInviteTokenUsed(code, username) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('UPDATE invite_codes SET used_by = ? WHERE code = ?', [username, code]);
    } catch (error) {
        console.error('Failed to set invite token used:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function isCodeExpired(code) {
    let expiryDays = config['invite-code-expiry-days'];

    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT created_at FROM invite_codes WHERE code = ?', [code]);
        console.log(rows)
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

async function setAdmin(userID, isAdmin) {
    console.log(userID, isAdmin)

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin, userID]);
    } catch (error) {
        console.error('Failed to set admin:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function resetPassword(userID, password) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('UPDATE users SET password = ? WHERE id = ?', [password, userID]);
    } catch (error) {
        console.error('Failed to set password:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function deleteUser(userID) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM users WHERE id = ?', [userID]);
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function logout(username) {
    let conn;
    try {
        const currentTime = new Date();
        conn = await pool.getConnection();
        await conn.query('UPDATE users SET last_logout = ? WHERE username = ?', [currentTime, username]);
    } catch (error) {
        console.error('Failed to log out user:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function checkAndCreateInitialInviteCode() {
    let users = await getUsers();
    let inviteCodes = await getInviteCodes();

    if (users.length === 0 && inviteCodes.length === 0) {
        let initialCode = process.env.INITIAL_INVITE_CODE;

        if (!initialCode) {
            console.error('No initial invite code found in environment variables');
            return;
        }

        await createInviteCode('Initial invite code', initialCode);
    }
}

module.exports = {
    databaseInit,
    userExists,
    addUser,
    getUsers,
    getUser,
    getUserByID,
    getPassword,
    getInviteCodes,
    createInviteCode,
    revokeInviteCode,
    verifyInviteCode,
    setInviteTokenUsed,
    isCodeExpired,
    setAdmin,
    resetPassword,
    deleteUser,
    logout
}