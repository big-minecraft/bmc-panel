const { getInstances, getProxies } = require("../redis");
const { getGamemodes, getGamemodeContent, updateGamemodeContent, toggleGamemode, deleteGamemode, createGamemode} = require("../gamemodes");
const { register, verify, verifyLogin, login} = require("../authentication");
const {getInviteCodes, createInviteCode, revokeInviteCode, getUsers, setAdmin, resetPassword, deleteUser, logout,
    getUser, getUserByID
} = require("../database");
const {verifyInvite} = require("../inviteCodes");

module.exports = {
    getInstances: async (req, res) => {
        const instances = await getInstances();
        res.json(instances);
    },

    getProxies: async (req, res) => {
        const proxies = await getProxies();
        res.json(proxies);
    },

    getGamemodes: async (req, res) => {
        try {
            const gamemodes = await getGamemodes();
            res.json(gamemodes);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch gamemodes' });
        }
    },

    getGamemodeContent: async (req, res) => {
        try {
            const { name } = req.params;
            const content = await getGamemodeContent(name);
            res.json({ content });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch gamemode content' });
        }
    },

    updateGamemodeContent: async (req, res) => {
        try {
            const { name } = req.params;
            const { content } = req.body;
            await updateGamemodeContent(name, content);
            res.json({ message: 'Gamemode updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update gamemode' });
        }
    },

    toggleGamemode: async (req, res) => {
        try {
            const { name } = req.params;
            const { enabled } = req.body;
            await toggleGamemode(name, enabled);
            res.json({ message: 'Gamemode toggled successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to toggle gamemode' });
        }
    },

    deleteGamemode: async (req, res) => {
        try {
            const {name} = req.params;
            await deleteGamemode(name);
            res.json({message: 'Gamemode deleted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to delete gamemode'});
        }
    },

    createGamemode: async (req, res) => {
        try {
            const {name} = req.body;
            await createGamemode(name);
            res.json({message: 'Gamemode created successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to create gamemode'});
        }
    },

    register: async (req, res) => {
        const { username, password, inviteToken } = req.body;
        try {
            const data_url = await register(username, password, inviteToken);
            res.json({ message: 'User registered successfully', qrCode: data_url });
        } catch (error) {
            if (error.message === 'User already exists') {
                return res.status(400).json({ error: 'User already exists' });
            }

            res.status(500).json({ error: 'Failed to register user' });
        }
    },

    verify: async (req, res) => {
        const { username, token, inviteToken } = req.body;
        try {
            const loginToken = await verify(username, token, inviteToken);
            let dbUser = await getUser(username);
            let isAdmin = dbUser.is_admin;
            res.json({ loginToken, isAdmin });
        } catch (error) {
            res.status(500).json({ error: 'Failed to verify token' });
        }
    },

    login: async (req, res) => {
        const { username, password } = req.body;
        try {
            const sessionToken = await login(username, password);
            res.json({ sessionToken });
        } catch (error) {
            res.status(500).json({ error: 'Failed to login' });
        }
    },

    verifyLogin: async (req, res) => {
        const { username, token, sessionToken } = req.body;
        try {
            const loginToken = await verifyLogin(username, token, sessionToken);
            let dbUser = await getUser(username);
            let isAdmin = dbUser.is_admin;

            res.json({ verified: true, token: loginToken, isAdmin: isAdmin });
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to verify login' });
        }
    },

    getInviteCodes: async (req, res) => {
        try {
            const codes = await getInviteCodes();
            res.json(codes);
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to fetch invite codes'});
        }
    },

    createInviteCode: async (req, res) => {
        const {message} = req.body;
        try {
            await createInviteCode(message);
            res.json({message: 'Invite code created successfully'});
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to create invite code'});
        }
    },

    revokeInviteCode: async (req, res) => {
        const {code} = req.params;
        try {
            await revokeInviteCode(code);
            res.json({message: 'Invite code revoked successfully'});
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Failed to revoke invite code'});
        }
    },

    verifyInvite: async (req, res) => {
        const {inviteCode} = req.body;
        try {
            let token = await verifyInvite(inviteCode);
            res.json({ token });
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Invalid invite code'});
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await getUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({error: 'Failed to fetch users'});
        }
    },

    async setAdmin(req, res) {
        const {id} = req.params;
        const {is_admin} = req.body;

        try {
            await setAdmin(id, is_admin);
            let dbUser = await getUserByID(id);
            await logout(dbUser.username);

            res.json({message: 'Updated user admin status'});
        } catch (error) {
            res.status(500).json({error: 'Failed to set user admin status'});
        }
    },

    async resetPassword(req, res) {
        const {id} = req.params;
        const {password} = req.body;

        try {
            await resetPassword(id, password);
            res.json({message: 'Password reset successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to reset password'});
        }
    },

    async deleteUser(req, res) {
        const {id} = req.params;

        try {
            await deleteUser(id);
            res.json({message: 'User deleted successfully'});
        } catch (error) {
            res.status(500).json({error: 'Failed to delete user'});
        }
    },

    async logout(req, res) {
        try {
            await logout(req.user.username);
        } catch (error) {
            res.status(500).json({error: 'Failed to log out user'});
        }

        res.json({message: 'Logged out successfully'});
    }
};

