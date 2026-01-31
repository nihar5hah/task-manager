const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { glob } = require('glob');

const execAsync = promisify(exec);

class SyncManager {
    constructor(tasksFile) {
        this.tasksFile = tasksFile;
        this.workspaceRoot = '/home/hyper/clawd';
        this.memoryDir = path.join(this.workspaceRoot, 'memory');
        this.heartbeatState = path.join(this.memoryDir, 'heartbeat-state.json');
    }

    async syncAll() {
        console.log('[Sync] Starting full task sync...');
        const tasks = [];

        try {
            // 1. Sync from cron jobs
            const cronTasks = await this.syncCronJobs();
            tasks.push(...cronTasks);

            // 2. Sync from heartbeat state
            const heartbeatTasks = await this.syncHeartbeatState();
            tasks.push(...heartbeatTasks);

            // 3. Sync from memory logs
            const memoryTasks = await this.syncMemoryLogs();
            tasks.push(...memoryTasks);

            // 4. Sync from project TASK.md files
            const projectTasks = await this.syncProjectFiles();
            tasks.push(...projectTasks);

            console.log(`[Sync] Found ${tasks.length} tasks from external sources`);
            return tasks;
        } catch (error) {
            console.error('[Sync] Error during sync:', error);
            return [];
        }
    }

    async syncCronJobs() {
        try {
            const { stdout } = await execAsync('clawdbot cron list --json 2>/dev/null || echo "[]"');
            const cronJobs = JSON.parse(stdout.trim() || '[]');
            
            return cronJobs.map(job => ({
                title: job.name || job.command,
                description: `Cron: ${job.schedule}\nCommand: ${job.command}`,
                status: job.enabled ? 'in-progress' : 'backlog',
                priority: 'medium',
                category: 'automation',
                source: 'cron',
                metadata: {
                    cronId: job.id,
                    schedule: job.schedule,
                    command: job.command,
                    enabled: job.enabled
                },
                tags: ['cron', 'scheduled', 'recurring']
            }));
        } catch (error) {
            console.error('[Sync] Error syncing cron jobs:', error.message);
            return [];
        }
    }

    async syncHeartbeatState() {
        try {
            const exists = await fs.access(this.heartbeatState).then(() => true).catch(() => false);
            if (!exists) return [];

            const content = await fs.readFile(this.heartbeatState, 'utf8');
            const state = JSON.parse(content);
            const tasks = [];

            // Extract tasks from heartbeat checks
            if (state.lastChecks) {
                Object.entries(state.lastChecks).forEach(([check, timestamp]) => {
                    if (timestamp) {
                        tasks.push({
                            title: `Heartbeat Check: ${check}`,
                            description: `Automatic periodic check\nLast run: ${new Date(timestamp * 1000).toISOString()}`,
                            status: 'in-progress',
                            priority: 'low',
                            category: 'automation',
                            source: 'heartbeat',
                            metadata: {
                                checkType: check,
                                lastRun: timestamp
                            },
                            tags: ['heartbeat', 'monitoring', 'recurring']
                        });
                    }
                });
            }

            // Extract pending tasks from heartbeat state
            if (state.pendingTasks) {
                state.pendingTasks.forEach(task => {
                    tasks.push({
                        title: task.title || task.description,
                        description: task.description || '',
                        status: 'todo',
                        priority: task.priority || 'medium',
                        category: task.category || 'project',
                        source: 'heartbeat',
                        metadata: task.metadata || {},
                        tags: ['heartbeat', ...(task.tags || [])]
                    });
                });
            }

            return tasks;
        } catch (error) {
            console.error('[Sync] Error syncing heartbeat state:', error.message);
            return [];
        }
    }

    async syncMemoryLogs() {
        try {
            const tasks = [];
            const memoryFiles = await glob(path.join(this.memoryDir, '*.md'));
            
            // Only scan recent files (last 30 days)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            for (const file of memoryFiles) {
                const stats = await fs.stat(file);
                if (stats.mtimeMs < thirtyDaysAgo) continue;

                const content = await fs.readFile(file, 'utf8');
                const filename = path.basename(file);
                
                // Extract TODO items
                const todoRegex = /^[\s-]*(?:TODO|TASK|Action Item):?\s*(.+)$/gim;
                let match;
                
                while ((match = todoRegex.exec(content)) !== null) {
                    const taskText = match[1].trim();
                    
                    // Check if it's marked as done
                    const isDone = /\[x\]|\[✓\]|✓|✅|DONE|COMPLETED/i.test(taskText);
                    
                    tasks.push({
                        title: taskText.replace(/\[x\]|\[✓\]|✓|✅|DONE|COMPLETED/gi, '').trim(),
                        description: `Found in ${filename}`,
                        status: isDone ? 'done' : 'todo',
                        priority: this.extractPriority(taskText),
                        category: this.categorizeTask(taskText),
                        source: 'memory',
                        metadata: {
                            file: filename,
                            line: content.substring(0, match.index).split('\n').length
                        },
                        tags: ['memory', 'todo']
                    });
                }

                // Extract checkbox items
                const checkboxRegex = /^[\s-]*\[ \]\s*(.+)$/gim;
                while ((match = checkboxRegex.exec(content)) !== null) {
                    const taskText = match[1].trim();
                    
                    tasks.push({
                        title: taskText,
                        description: `Found in ${filename}`,
                        status: 'todo',
                        priority: this.extractPriority(taskText),
                        category: this.categorizeTask(taskText),
                        source: 'memory',
                        metadata: {
                            file: filename,
                            line: content.substring(0, match.index).split('\n').length
                        },
                        tags: ['memory', 'checkbox']
                    });
                }
            }

            return tasks;
        } catch (error) {
            console.error('[Sync] Error syncing memory logs:', error.message);
            return [];
        }
    }

    async syncProjectFiles() {
        try {
            const tasks = [];
            const taskFiles = await glob(path.join(this.workspaceRoot, '**/TASK.md'), {
                ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
            });

            for (const file of taskFiles) {
                const content = await fs.readFile(file, 'utf8');
                const projectName = path.basename(path.dirname(file));
                
                // Parse markdown task lists
                const lines = content.split('\n');
                let currentSection = 'backlog';
                
                for (const line of lines) {
                    // Detect section headers
                    if (/^#+\s*(backlog|todo|in[-\s]?progress|done)/i.test(line)) {
                        const match = line.match(/^#+\s*(backlog|todo|in[-\s]?progress|done)/i);
                        currentSection = match[1].toLowerCase().replace(/\s+/g, '-');
                        continue;
                    }
                    
                    // Parse task items
                    const taskMatch = line.match(/^[\s-]*\[([ x✓])\]\s*(.+)$/i);
                    if (taskMatch) {
                        const [, checked, taskText] = taskMatch;
                        const isDone = checked.toLowerCase() === 'x' || checked === '✓';
                        
                        tasks.push({
                            title: `[${projectName}] ${taskText}`,
                            description: `From project task file: ${file}`,
                            status: isDone ? 'done' : currentSection,
                            priority: this.extractPriority(taskText),
                            category: 'project',
                            source: 'project',
                            metadata: {
                                project: projectName,
                                file: file.replace(this.workspaceRoot, '')
                            },
                            tags: ['project', projectName]
                        });
                    }
                }
            }

            return tasks;
        } catch (error) {
            console.error('[Sync] Error syncing project files:', error.message);
            return [];
        }
    }

    extractPriority(text) {
        const lower = text.toLowerCase();
        if (/urgent|critical|asap|emergency/i.test(lower)) return 'urgent';
        if (/high|important|priority/i.test(lower)) return 'high';
        if (/low|minor|someday/i.test(lower)) return 'low';
        return 'medium';
    }

    categorizeTask(text) {
        const lower = text.toLowerCase();
        if (/cron|automat|script|bot|heartbeat/i.test(lower)) return 'automation';
        if (/email|message|slack|discord|telegram|notify/i.test(lower)) return 'communication';
        if (/fix|bug|maintain|update|upgrade|patch/i.test(lower)) return 'maintenance';
        return 'project';
    }

    async mergeTasks(existingTasks, syncedTasks) {
        const merged = [...existingTasks];
        const existingMap = new Map(existingTasks.map(t => [this.generateTaskKey(t), t]));

        for (const syncedTask of syncedTasks) {
            const key = this.generateTaskKey(syncedTask);
            
            if (!existingMap.has(key)) {
                // New task - add it
                merged.push({
                    id: this.generateUUID(),
                    ...syncedTask,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    completedAt: syncedTask.status === 'done' ? new Date().toISOString() : null,
                    dueDate: null,
                    tags: syncedTask.tags || []
                });
            } else {
                // Existing task - potentially update it
                const existing = existingMap.get(key);
                if (existing.source === syncedTask.source && existing.status !== 'done') {
                    // Update status if changed externally
                    if (syncedTask.status && syncedTask.status !== existing.status) {
                        existing.status = syncedTask.status;
                        existing.updatedAt = new Date().toISOString();
                        if (syncedTask.status === 'done') {
                            existing.completedAt = new Date().toISOString();
                        }
                    }
                }
            }
        }

        return merged;
    }

    generateTaskKey(task) {
        // Generate a unique key based on title and source
        const title = (task.title || '').toLowerCase().trim();
        const source = task.source || 'manual';
        const metadata = task.metadata || {};
        
        if (source === 'cron' && metadata.cronId) {
            return `cron:${metadata.cronId}`;
        }
        if (source === 'project' && metadata.file) {
            return `project:${metadata.file}:${title}`;
        }
        
        return `${source}:${title}`;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

module.exports = SyncManager;
