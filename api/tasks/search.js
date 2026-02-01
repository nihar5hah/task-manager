const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const filePath = path.join(__dirname, '../../data/tasks.json');
    const { query } = req.body;

    if (!query) {
        return res.status(400).send({ error: 'Search query is required.' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to load tasks.' });
        }

        const tasks = JSON.parse(data);
        const results = tasks.filter(task => 
            Object.values(task).some(value => 
                value && value.toString().toLowerCase().includes(query.toLowerCase())
            )
        );

        return res.status(200).send(results);
    });
};