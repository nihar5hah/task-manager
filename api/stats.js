const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const statsPath = path.join(__dirname, '..', 'data/tasks.json');
    fs.readFile(statsPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send({ error: 'Failed to calculate stats.' });
        } else {
            const tasks = JSON.parse(data);
            const stats = {
                total: tasks.length,
                completed: tasks.filter(task => task.completed).length,
                pending: tasks.filter(task => !task.completed).length
            };
            res.status(200).send(stats);
        }
    });
};