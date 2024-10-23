const {getPods} = require("../k8s");
module.exports = {
    getMain: (req, res) => {
        res.send('Welcome to API v1.');
    },
    getJson: (req, res) => {
        const randArr = ['String 1', 'String 2', 'String 3'];
        const rand = randArr[Math.floor(Math.random() * randArr.length)];
        res.json({test: rand});
    },
    getPods: async (req, res) => {
        const pods = await getPods("default");
        res.json(pods);
    }
};