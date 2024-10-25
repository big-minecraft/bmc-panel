const { getInstances, getProxies } = require("../redis");
const { getGamemodes, getGamemodeContent, updateGamemodeContent, toggleGamemode, deleteGamemode, createGamemode} = require("../gamemodes");

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
    }
};

