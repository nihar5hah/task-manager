const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const SyncManager = require('./sync-manager');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Create HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });
const clients = new Set();

// Broadcast to all connected clients
function broadcast(message) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    clients.add(ws);

    ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
        clients.delete(ws);
    });

    // Send initial connection success
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize sync manager
let syncManager;

// Initialize data files if they don't exist
async function initializeDataFiles() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }

    try {
        await fs.access(TASKS_FILE);
    } catch {
        await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks: [], lastUpdated: new Date().toISOString() }, null, 2));
    }

    try {
        await fs.access(CONFIG_FILE);
    } catch {
        const defaultConfig = {
            categories: ['automation', 'project', 'communication', 'maintenance'],
            priorities: ['low', 'medium', 'high', 'urgent'],
            statuses: ['backlog', 'todo', 'in-progress', 'done']
        };
        await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }

    // Initialize sync manager
    syncManager = new SyncManager(TASKS_FILE);
}

// Helper functions
async function readTasks() {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
}

async function writeTasks(data) {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(TASKS_FILE, JSON.stringify(data, null, 2));
    
    // Broadcast update to all clients
    broadcast({ type: 'tasks_updated', tasks: data.tasks });
}

async function readConfig() {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// API Routes

// Get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const data = await readTasks();
        res.json(data.tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get task by ID
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const data = await readTasks();
        const task = data.tasks.find(t => t.id === req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new task
app.post('/api/tasks', async (req, res) => {
    try {
        const data = await readTasks();
        const newTask = {
            id: generateUUID(),
            title: req.body.title,
            description: req.body.description || '',
            status: req.body.status || 'backlog',
            priority: req.body.priority || 'medium',
            category: req.body.category || 'project',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null,
            dueDate: req.body.dueDate || null,
            source: req.body.source || 'manual',
            metadata: req.body.metadata || {},
            tags: req.body.tags || [],
            dependencies: req.body.dependencies || [],
            subtasks: req.body.subtasks || []
        };
        data.tasks.push(newTask);
        await writeTasks(data);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const data = await readTasks();
        const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const updatedTask = {
            ...data.tasks[taskIndex],
            ...req.body,
            id: req.params.id, // Prevent ID change
            updatedAt: new Date().toISOString()
        };

        // Set completedAt when task is marked as done
        if (updatedTask.status === 'done' && !updatedTask.completedAt) {
            updatedTask.completedAt = new Date().toISOString();
        } else if (updatedTask.status !== 'done') {
            updatedTask.completedAt = null;
        }

        data.tasks[taskIndex] = updatedTask;
        await writeTasks(data);
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const data = await readTasks();
        const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }

        data.tasks.splice(taskIndex, 1);
        await writeTasks(data);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const data = await readTasks();
        const stats = {
            total: data.tasks.length,
            byStatus: {
                backlog: data.tasks.filter(t => t.status === 'backlog').length,
                todo: data.tasks.filter(t => t.status === 'todo').length,
                inProgress: data.tasks.filter(t => t.status === 'in-progress').length,
                done: data.tasks.filter(t => t.status === 'done').length
            },
            byPriority: {
                low: data.tasks.filter(t => t.priority === 'low').length,
                medium: data.tasks.filter(t => t.priority === 'medium').length,
                high: data.tasks.filter(t => t.priority === 'high').length,
                urgent: data.tasks.filter(t => t.priority === 'urgent').length
            },
            byCategory: {},
            completedToday: 0,
            completedThisWeek: 0
        };

        // Count by category
        data.tasks.forEach(task => {
            if (!stats.byCategory[task.category]) {
                stats.byCategory[task.category] = 0;
            }
            stats.byCategory[task.category]++;
        });

        // Count completed today and this week
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        data.tasks.forEach(task => {
            if (task.completedAt) {
                const completedDate = new Date(task.completedAt);
                if (completedDate >= todayStart) {
                    stats.completedToday++;
                }
                if (completedDate >= weekStart) {
                    stats.completedThisWeek++;
                }
            }
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get config
app.get('/api/config', async (req, res) => {
    try {
        const config = await readConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk update tasks (for drag and drop)
app.post('/api/tasks/bulk-update', async (req, res) => {
    try {
        const data = await readTasks();
        const updates = req.body.updates; // Array of {id, status}

        updates.forEach(update => {
            const taskIndex = data.tasks.findIndex(t => t.id === update.id);
            if (taskIndex !== -1) {
                data.tasks[taskIndex].status = update.status;
                data.tasks[taskIndex].updatedAt = new Date().toISOString();

                if (update.status === 'done' && !data.tasks[taskIndex].completedAt) {
                    data.tasks[taskIndex].completedAt = new Date().toISOString();
                } else if (update.status !== 'done') {
                    data.tasks[taskIndex].completedAt = null;
                }
            }
        });

        await writeTasks(data);
        res.json({ message: 'Tasks updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sync tasks from external sources
app.post('/api/sync', async (req, res) => {
    try {
        console.log('[API] Manual sync triggered');
        const syncedTasks = await syncManager.syncAll();
        const data = await readTasks();
        
        const mergedTasks = await syncManager.mergeTasks(data.tasks, syncedTasks);
        data.tasks = mergedTasks;
        
        await writeTasks(data);
        
        res.json({ 
            message: 'Sync completed',
            synced: syncedTasks.length,
            total: mergedTasks.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get task relationships (for graph view)
app.get('/api/tasks/relationships', async (req, res) => {
    try {
        const data = await readTasks();
        const relationships = [];

        data.tasks.forEach(task => {
            // Add dependency relationships
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(depId => {
                    relationships.push({
                        from: depId,
                        to: task.id,
                        type: 'dependency'
                    });
                });
            }

            // Add tag-based relationships
            if (task.tags && task.tags.length > 0) {
                data.tasks.forEach(otherTask => {
                    if (otherTask.id !== task.id && otherTask.tags) {
                        const commonTags = task.tags.filter(t => otherTask.tags.includes(t));
                        if (commonTags.length > 0) {
                            relationships.push({
                                from: task.id,
                                to: otherTask.id,
                                type: 'tag',
                                tags: commonTags
                            });
                        }
                    }
                });
            }
        });

        res.json(relationships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Background sync every 5 minutes
let syncInterval;
function startBackgroundSync() {
    // Run initial sync after 10 seconds
    setTimeout(async () => {
        try {
            console.log('[Background Sync] Running initial sync...');
            const syncedTasks = await syncManager.syncAll();
            const data = await readTasks();
            const mergedTasks = await syncManager.mergeTasks(data.tasks, syncedTasks);
            data.tasks = mergedTasks;
            await writeTasks(data);
            console.log('[Background Sync] Initial sync completed');
        } catch (error) {
            console.error('[Background Sync] Error:', error);
        }
    }, 10000);

    // Run sync every 5 minutes
    syncInterval = setInterval(async () => {
        try {
            console.log('[Background Sync] Running scheduled sync...');
            const syncedTasks = await syncManager.syncAll();
            const data = await readTasks();
            const mergedTasks = await syncManager.mergeTasks(data.tasks, syncedTasks);
            data.tasks = mergedTasks;
            await writeTasks(data);
            console.log('[Background Sync] Scheduled sync completed');
        } catch (error) {
            console.error('[Background Sync] Error:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Initialize and start server
initializeDataFiles().then(() => {
    // Start background sync
    startBackgroundSync();

    server.listen(PORT, () => {
        console.log(`Task Manager server running on http://localhost:${PORT}`);
        console.log(`WebSocket server running on ws://localhost:${PORT}`);
        console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
    });
}).catch(error => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    if (syncInterval) clearInterval(syncInterval);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Export for Vercel
module.exports = app;
