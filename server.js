const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;

const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Initialize tasks file if it doesn't exist
if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([]), 'utf8');
}

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Helper function to read tasks
function readTasks() {
    try {
        const data = fs.readFileSync(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading tasks:', error);
        return [];
    }
}

// Helper function to write tasks
function writeTasks(tasks) {
    try {
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing tasks:', error);
        return false;
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

// Create new task
app.post('/api/tasks', (req, res) => {
    try {
        const tasks = readTasks();
        const newTask = {
            id: uuidv4(),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
        
        if (writeTasks(tasks)) {
            res.status(201).json(newTask);
        } else {
            res.status(500).json({ error: 'Failed to save task' });
        }
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Bulk operations (MUST be before /:id routes to avoid matching "bulk-update" as an ID)
app.post('/api/tasks/bulk-update', (req, res) => {
    try {
        const { ids, updates } = req.body;
        const tasks = readTasks();
        
        tasks.forEach(task => {
            if (ids.includes(task.id)) {
                Object.assign(task, updates, {
                    updatedAt: new Date().toISOString()
                });
            }
        });
        
        if (writeTasks(tasks)) {
            res.json({ message: 'Tasks updated', count: ids.length });
        } else {
            res.status(500).json({ error: 'Failed to update tasks' });
        }
    } catch (error) {
        console.error('Error bulk updating tasks:', error);
        res.status(500).json({ error: 'Failed to bulk update tasks' });
    }
});

app.delete('/api/tasks/bulk-delete', (req, res) => {
    try {
        const { ids } = req.body;
        const tasks = readTasks();
        const filteredTasks = tasks.filter(t => !ids.includes(t.id));
        
        if (writeTasks(filteredTasks)) {
            res.json({ message: 'Tasks deleted', count: ids.length });
        } else {
            res.status(500).json({ error: 'Failed to delete tasks' });
        }
    } catch (error) {
        console.error('Error bulk deleting tasks:', error);
        res.status(500).json({ error: 'Failed to bulk delete tasks' });
    }
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
    try {
        const tasks = readTasks();
        const taskIndex = tasks.findIndex(t => t.id === req.params.id);
        
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        if (writeTasks(tasks)) {
            res.json(tasks[taskIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update task' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    try {
        const tasks = readTasks();
        const filteredTasks = tasks.filter(t => t.id !== req.params.id);
        
        if (tasks.length === filteredTasks.length) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        if (writeTasks(filteredTasks)) {
            res.json({ message: 'Task deleted' });
        } else {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Sync with cron jobs
app.post('/api/sync', (req, res) => {
    try {
        // This endpoint can be enhanced to sync with actual cron jobs
        // For now, just return success
        res.json({ message: 'Sync completed' });
    } catch (error) {
        console.error('Error syncing:', error);
        res.status(500).json({ error: 'Failed to sync' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`✅ Task Manager running on http://localhost:${port}`);
    console.log(`📁 Tasks file: ${TASKS_FILE}`);
});