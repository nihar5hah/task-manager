const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const filePath = path.join(__dirname, '../../data/tasks.json');
    const { taskIds, updates } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || !updates) {
        return res.status(400).send({ error: 'Invalid request format. Need taskIds array and updates object.' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to load tasks.' });
        }

        const parsed = JSON.parse(data);
        const tasks = parsed.tasks || parsed;
        
        taskIds.forEach(id => {
            const index = tasks.findIndex(task => task.id === id);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
            }
        });

        const output = {
            tasks: tasks,
            lastUpdated: new Date().toISOString()
        };

        fs.writeFile(filePath, JSON.stringify(output, null, 2), (err) => {
            if (err) {
                return res.status(500).send({ error: 'Failed to update tasks.' });
            }
            return res.status(200).send({ message: 'Tasks updated successfully.', count: taskIds.length });
        });
    });
};