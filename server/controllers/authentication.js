const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const {userExists, addUser, getSecret, getPassword} = require("./database");
const config = require('../config.json');
const jwt = require('jsonwebtoken');
const {join} = require("path");
const {writeFileSync} = require("fs");

const users = {};
const tempTokens = {};

function authInit() {
    if (config["token-secret"] && config["token-secret"] === "secret") {
        // Update the config object
        config["token-secret"] = Math.random().toString(36).substr(2);

        // Write the updated config back to the config.json file
        writeFileSync(
            join(__dirname, '../config.json'),
            JSON.stringify(config, null, 2)
        );

        console.log("Randomizing token secret");
    }
}

async function register(username, password) {
    if (await userExists(username)) throw new Error('User already exists');

    const secret = speakeasy.generateSecret({
        length: 20,
        name: `Big Minecraft (${username})`,
        issuer: 'Big Minecraft'
    });
    users[username] = { password, secret: secret.base32 };

    return await new Promise((resolve, reject) => {
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) reject(err);
            else resolve(data_url);
        });
    });
}
async function verify(username, token) {
    const user = users[username];

    if (!user) throw new Error('User not found');

    const verified = speakeasy.totp.verify({
        secret: user.secret,
        encoding: 'base32',
        token
    });

    if (verified) {
        delete users[username];
        await addUser(username, user.password, user.secret);
    }

    return verified;
}

async function login(username, password) {
    if (!(await userExists(username))) throw new Error('User not found');

    let storedPassword = await getPassword(username);
    if (password !== storedPassword) throw new Error('Invalid password');

    const token = Math.random().toString(36).substr(2);
    tempTokens[username] = { secret: token };
    return tempTokens[username].secret;
}

async function verifyLogin(username, token, sessionToken) {
    if (!sessionToken) throw new Error('Session token not found');

    const tempToken = tempTokens[username];

    if (!tempToken) throw new Error('User not found');
    if (tempToken.secret !== sessionToken) throw new Error('Invalid session token');

    let secret = await getSecret(username);

    let verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token
    });

    if (!verified) throw new Error('Invalid token');

    const payload = { username: username };
    const options = { expiresIn: "7d" };

    return jwt.sign(payload, config["token-secret"], options);
}

module.exports = {
    authInit,
    register,
    verify,
    login,
    verifyLogin,
}