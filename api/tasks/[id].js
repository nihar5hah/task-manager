const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const filePath = path.join(__dirname, '../../data/tasks.json');
    const { id } = req.query;

    if (!id) {
        return res.status(400).send({ error: 'Task ID is required.' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to load tasks.' });
        }

        const parsed = JSON.parse(data);
        const tasks = parsed.tasks || parsed;
        const taskIndex = tasks.findIndex(task => task.id === id);

        if (req.method === 'GET') {
            if (taskIndex === -1) {
                return res.status(404).send({ error: 'Task not found.' });
            }
            return res.status(200).send(tasks[taskIndex]);
        }

        if (req.method === 'PUT') {
            if (taskIndex === -1) {
                return res.status(404).send({ error: 'Task not found.' });
            }

            const updatedTask = { ...tasks[taskIndex], ...req.body, updatedAt: new Date().toISOString() };
            tasks[taskIndex] = updatedTask;

            const output = {
                tasks: tasks,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFile(filePath, JSON.stringify(output, null, 2), (err) => {
                if (err) {
                    return res.status(500).send({ error: 'Failed to update task.' });
                }
                return res.status(200).send(updatedTask);
            });
        }

        if (req.method === 'DELETE') {
            if (taskIndex === -1) {
                return res.status(404).send({ error: 'Task not found.' });
            }

            tasks.splice(taskIndex, 1);
            
            const output = {
                tasks: tasks,
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFile(filePath, JSON.stringify(output, null, 2), (err) => {
                if (err) {
                    return res.status(500).send({ error: 'Failed to delete task.' });
                }
                return res.status(200).send({ message: 'Task deleted successfully.' });
            });
        }
    });
};