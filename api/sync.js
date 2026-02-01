const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

module.exports = async (req, res) => {
    try {
        console.log('[Sync] Starting task sync from cron jobs...');
        
        // Get cron jobs using clawdbot CLI
        const { stdout } = await execAsync('clawdbot cron list --json || echo "[]"');
        const cronJobs = JSON.parse(stdout.trim() || '[]');
        
        console.log(`[Sync] Found ${cronJobs.length} cron jobs`);
        
        // Convert cron jobs to tasks
        const cronTasks = cronJobs.jobs ? cronJobs.jobs.map(job => ({
            id: `cron-${job.id}`,
            title: job.name || 'Unnamed Cron Job',
            description: `Schedule: ${job.schedule?.expr || 'N/A'}\n\nPayload: ${job.payload?.message || JSON.stringify(job.payload)}`,
            status: job.enabled ? 'in-progress' : 'backlog',
            priority: job.name?.includes('urgent') || job.name?.includes('important') ? 'high' : 'medium',
            category: job.payload?.kind === 'systemEvent' ? 'automation' : 'communication',
            source: 'cron',
            metadata: {
                cronId: job.id,
                schedule: job.schedule,
                enabled: job.enabled,
                nextRunAtMs: job.state?.nextRunAtMs,
                lastRunAtMs: job.state?.lastRunAtMs
            },
            tags: ['cron', 'scheduled', job.enabled ? 'active' : 'disabled'],
            createdAt: new Date(job.createdAtMs || Date.now()).toISOString(),
            updatedAt: new Date(job.updatedAtMs || Date.now()).toISOString(),
            completedAt: null,
            dueDate: job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString().split('T')[0] : null
        })) : [];
        
        // Read existing tasks
        const tasksFilePath = path.join(__dirname, '..', 'data', 'tasks.json');
        let existingData;
        try {
            const fileContent = await fs.readFile(tasksFilePath, 'utf8');
            existingData = JSON.parse(fileContent);
        } catch (error) {
            existingData = { tasks: [], lastUpdated: new Date().toISOString() };
        }
        
        const existingTasks = existingData.tasks || existingData;
        
        // Merge: Remove old cron tasks, keep manual tasks, add new cron tasks
        const manualTasks = Array.isArray(existingTasks) ? 
            existingTasks.filter(t => t.source !== 'cron') : [];
        
        const mergedTasks = [...manualTasks, ...cronTasks];
        
        // Write back
        const output = {
            tasks: mergedTasks,
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(tasksFilePath, JSON.stringify(output, null, 2));
        
        console.log(`[Sync] Synced ${cronTasks.length} cron tasks, kept ${manualTasks.length} manual tasks`);
        
        res.status(200).json({ 
            message: 'Tasks synchronized successfully',
            synced: {
                cronTasks: cronTasks.length,
                manualTasks: manualTasks.length,
                total: mergedTasks.length
            }
        });
    } catch (error) {
        console.error('[Sync] Error:', error);
        res.status(500).json({ 
            error: 'Failed to sync tasks',
            details: error.message
        });
    }
};
