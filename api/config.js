const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const configPath = path.join(__dirname, '..', 'data/config.json');
    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send({ error: 'Failed to load config.' });
        } else {
            res.status(200).send(JSON.parse(data));
        }
    });
};