const { verifyInviteCode } = require('../controllers/database')
const {isCodeExpired} = require("./database");

const tokens = {}

async function verifyInvite(code) {
    if (await isCodeExpired(code)) throw new Error('Invite code expired');
    let verified = await verifyInviteCode(code);
    if (!verified) throw new Error('Invalid invite code');

    const token = Math.random().toString(36).substr(2);
    tokens[code] = token;

    return token;
}

function checkToken(token) {
    for (let code in tokens) {
        if (tokens[code] === token) return true;
    }
    return false;
}

function removeToken(token) {
    for (let code in tokens) {
        if (tokens[code] === token) {
            delete tokens[code];
            return;
        }
    }
}

function getCode(token) {
    for (let code in tokens) {
        if (tokens[code] === token) return code;
    }
    return null;
}



module.exports = {
    tokens,
    verifyInvite,
    checkToken,
    removeToken,
    getCode
}