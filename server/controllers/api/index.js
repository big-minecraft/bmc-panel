const { getInstances, getProxies } = require("../redis");
const { getGamemodes, getGamemodeContent, updateGamemodeContent, toggleGamemode, deleteGamemode, createGamemode} = require("../gamemodes");
const { register, verify, verifyLogin, login} = require("../authentication");

module.exports = {
    // Existing controllers
    getMain: (req, res) => {
        res.send('Welcome to API v1.');
    },
    getJson: (req, res) => {
        const randArr = ['String 1', 'String 2', 'String 3'];
        const rand = randArr[Math.floor(Math.random() * randArr.length)];
        res.json({test: rand});
    },
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
        const { username, password } = req.body;
        try {
            const data_url = await register(username, password);
            res.json({ message: 'User registered successfully', qrCode: data_url });
        } catch (error) {
            if (error.message === 'User already exists') {
                return res.status(400).json({ error: 'User already exists' });
            }

            res.status(500).json({ error: 'Failed to register user' });
        }
    },

    verify: async (req, res) => {
        const { username, token } = req.body;
        try {
            const verified = await verify(username, token);
            res.json({ verified });
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
            res.json({ verified: true, token: loginToken });
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to verify login' });
        }
    },
};

