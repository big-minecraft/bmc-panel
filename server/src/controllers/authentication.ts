import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import {userExists, addUser, getPassword, setInviteTokenUsed, getUser} from "./database";
import config from '../config';
import jwt from 'jsonwebtoken';
import {join} from "path";
import {writeFileSync} from "fs";
import {checkToken, removeToken, getCode} from "./inviteCodes";

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

async function register(username: string, password: string, inviteToken: string) {
    if (await userExists(username)) throw new Error('User already exists');
    if (!checkToken(inviteToken)) throw new Error('Invalid invite token');

    const secret = speakeasy.generateSecret({
        length: 20,
        name: `Big Minecraft (${username})`,
        issuer: 'Big Minecraft'
    });
    users[username] = {password, secret: secret.base32};

    return await new Promise((resolve, reject) => {
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) reject(err);
            else resolve(data_url);
        });
    });
}

async function verify(username, token, inviteToken) {
    const user = users[username];

    if (!checkToken(inviteToken)) throw new Error('Invalid invite token');

    if (!user) throw new Error('User not found');

    const verified = speakeasy.totp.verify({
        secret: user.secret,
        encoding: 'base32',
        token
    });

    let environment = config.environment;

    if (verified || environment === 'development') {
        delete users[username];
        await addUser(username, user.password, user.secret);
    }

    if (!verified && environment === "production") throw new Error('Invalid token');

    await setInviteTokenUsed(getCode(inviteToken), username);
    removeToken(inviteToken)

    return await generateToken(username);
}

async function login(username, password) {
    if (!(await userExists(username))) throw new Error('User not found');

    let storedPassword = await getPassword(username);
    if (password !== storedPassword) throw new Error('Invalid password');

    const token = Math.random().toString(36).substr(2);
    tempTokens[username] = {secret: token};
    return tempTokens[username].secret;
}

async function verifyLogin(username, token, sessionToken) {
    if (!sessionToken) throw new Error('Session token not found');

    const tempToken = tempTokens[username];

    if (!tempToken) throw new Error('User not found');
    if (tempToken.secret !== sessionToken) throw new Error('Invalid session token');

    let user = await getUser(username);
    let secret = user.secret;

    let verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token
    });

    let environment = config.environment;
    if (!verified && environment === "production") throw new Error('Invalid token');

    return await generateToken(username);
}

async function generateToken(username) {
    const payload = {username: username};
    const options = {expiresIn: "7d"};

    return jwt.sign(payload, config["token-secret"], options);
}

export {
    authInit,
    register,
    verify,
    login,
    verifyLogin,
}