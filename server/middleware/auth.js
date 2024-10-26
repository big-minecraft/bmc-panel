const jwt = require('jsonwebtoken');
const config = require('../config.json');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) return res.status(403).send({ message: 'No token provided.' });

    const token = authHeader.split(' ')[1];

    if (!token) return res.status(403).send({ message: 'Invalid token format.' });

    try {
        const decoded = jwt.verify(token, config["token-secret"]);

        req.user = decoded;

        next();
    } catch (err) {
        console.error('Token verification error:', err.message);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({
                message: 'Token has expired.'
            });
        }

        return res.status(401).send({
            message: 'Failed to authenticate token.',
            error: err.message
        });
    }
};

module.exports = verifyToken;