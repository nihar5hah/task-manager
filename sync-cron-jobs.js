#!/usr/bin/env node
/**
 * Sync Cron Jobs to Task Manager
 * Creates tasks for all enabled cron jobs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Get cron jobs from clawdbot
function getCronJobs() {
    try {
        const output = execSync('clawdbot cron list --json', { encoding: 'utf8' });
        const data = JSON.parse(output);
        return data.jobs || [];
    } catch (error) {
        console.error('Error getting cron jobs:', error.message);
        return [];
    }
}

// Read existing tasks
function readTasks() {
    try {
        const data = fs.readFileSync(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading tasks:', error.message);
        return [];
    }
}

// Write tasks
function writeTasks(tasks) {
    try {
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing tasks:', error.message);
        return false;
    }
}

// Map cron job to task
function cronToTask(job) {
    const name = job.name;
    const isDaily = job.schedule.expr && (
        job.schedule.expr.includes('* * *') || // Daily pattern
        ['0 2', '0 4', '0 9', '30 13', '0 19', '0 23', '30 23', '0 0'].some(t => job.schedule.expr.includes(t))
    );
    
    // Determine category and priority
    let category = 'automation';
    let priority = 'medium';
    
    if (name.includes('Brief') || name.includes('Work')) {
        priority = 'high';
    }
    if (name.includes('Med') || name.includes('medicine')) {
        priority = 'high';
        category = 'communication';
    }
    if (name.includes('Gym') || name.includes('GRE') || name.includes('Abs')) {
        category = 'communication';
    }
    if (name.includes('NPTEL') || name.includes('Quiz')) {
        category = 'project';
    }
    if (name.includes('Barça') || name.includes('Match')) {
        category = 'automation';
        priority = 'low';
    }
    
    // Extract time from cron expression
    let timeDesc = '';
    if (job.schedule.kind === 'cron') {
        const parts = job.schedule.expr.split(' ');
        if (parts.length >= 2) {
            const hour = parts[1];
            const min = parts[0];
            timeDesc = ` - ${hour}:${min.padStart(2, '0')}`;
        }
    }
    
    return {
        id: `cron-${job.id}`,
        title: name + timeDesc,
        description: job.payload.message || 'Scheduled cron job',
        status: 'todo',
        priority: priority,
        category: category,
        tags: [
            'cron',
            ...(isDaily ? ['daily'] : []),
            'automated'
        ],
        cronJobId: job.id,
        createdAt: new Date(job.createdAtMs).toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// Main sync function
function syncCronJobs() {
    console.log('🔄 Syncing cron jobs to Task Manager...\n');
    
    const cronJobs = getCronJobs();
    const tasks = readTasks();
    
    // Get existing cron-based task IDs
    const existingCronTasks = tasks.filter(t => t.id.startsWith('cron-')).map(t => t.cronJobId);
    
    let added = 0;
    let updated = 0;
    let skipped = 0;
    
    cronJobs.forEach(job => {
        if (!job.enabled) {
            skipped++;
            return; // Skip disabled jobs
        }
        
        const taskId = `cron-${job.id}`;
        const existingTask = tasks.find(t => t.id === taskId);
        
        if (existingTask) {
            // Update existing task (keep status)
            const updatedTask = cronToTask(job);
            updatedTask.status = existingTask.status; // Preserve status
            Object.assign(existingTask, updatedTask);
            updated++;
            console.log(`✏️  Updated: ${job.name}`);
        } else {
            // Add new task
            const newTask = cronToTask(job);
            tasks.push(newTask);
            added++;
            console.log(`✅ Added: ${job.name}`);
        }
    });
    
    if (writeTasks(tasks)) {
        console.log(`\n✨ Sync complete!`);
        console.log(`   Added: ${added}`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Skipped (disabled): ${skipped}`);
        console.log(`   Total tasks: ${tasks.length}`);
    } else {
        console.error('❌ Failed to save tasks');
    }
}

// Run
syncCronJobs();
