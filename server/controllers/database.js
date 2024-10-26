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
        await createTable();
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
}

async function createTable() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), secret VARCHAR(255))');
    } catch (error) {
        console.error('Failed to create table:', error);
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
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('INSERT INTO users (username, password, secret) VALUES (?, ?, ?)', [username, password, secret]);
    } catch (error) {
        console.error('Failed to add user:', error);
        throw error;
    } finally {
        if (conn) await conn.end();
    }
}

async function getSecret(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT secret FROM users WHERE username = ?', [username]);
        return rows[0].secret;
    } catch (error) {
        console.error('Failed to get secret:', error);
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

module.exports = {
    databaseInit,
    userExists,
    addUser,
    getSecret,
    getPassword
}