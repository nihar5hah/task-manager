const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    const filePath = path.join(__dirname, '../data/tasks.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to load tasks.' });
        }

        const parsed = JSON.parse(data);
        const tasks = parsed.tasks || parsed; // Handle both {tasks: [...]} and [...] formats

        if (req.method === 'GET') {
            return res.status(200).send(tasks);
        }

        if (req.method === 'POST') {
            const newTask = req.body;
            newTask.id = String(Date.now());
            newTask.createdAt = new Date().toISOString();
            newTask.updatedAt = new Date().toISOString();
            tasks.push(newTask);

            const output = {
                tasks: tasks,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFile(filePath, JSON.stringify(output, null, 2), (err) => {
                if (err) {
                    return res.status(500).send({ error: 'Failed to save the new task.' });
                }
                return res.status(201).send(newTask);
            });
        }

        if (req.method === 'PUT') {
            const updatedTask = req.body;
            const index = tasks.findIndex(task => task.id === updatedTask.id);

            if (index === -1) {
                return res.status(404).send({ error: 'Task not found.' });
            }

            tasks[index] = { ...tasks[index], ...updatedTask, updatedAt: new Date().toISOString() };
            
            const output = {
                tasks: tasks,
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFile(filePath, JSON.stringify(output, null, 2), (err) => {
                if (err) {
                    return res.status(500).send({ error: 'Failed to update the task.' });
                }
                return res.status(200).send(tasks[index]);
            });
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            const index = tasks.findIndex(task => task.id === id);

            if (index === -1) {
                return res.status(404).send({ error: 'Task not found.' });
            }

            tasks.splice(index, 1);
            
            const output = {
                tasks: tasks,
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFile(filePath, JSON.stringify(output, null, 2), (err) => {
                if (err) {
                    return res.status(500).send({ error: 'Failed to delete the task.' });
                }
                return res.status(200).send({ message: 'Task deleted successfully.' });
            });
        }
    });
};