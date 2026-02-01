#!/usr/bin/env node

/**
 * Sync Script - Pull cron jobs and update tasks.json
 * Run this locally: node sync-cron.js
 */

const fs = require('fs').promises;
const path = require('path');

async function syncCronJobs() {
    try {
        console.log('🔄 Syncing cron jobs to tasks...');
        
        // Use the cron tool via require
        const cronTool = require('./cron-tool-wrapper.js');
        const cronJobs = await cronTool.list();
        
        if (!cronJobs || !cronJobs.jobs) {
            console.error('❌ Failed to get cron jobs');
            return;
        }
        
        console.log(`📋 Found ${cronJobs.jobs.length} cron jobs`);
        
        // Convert to tasks
        const cronTasks = cronJobs.jobs.map(job => {
            const nextRun = job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs) : null;
            const dueDate = nextRun ? nextRun.toISOString().split('T')[0] : null;
            
            return {
                id: `cron-${job.id}`,
                title: job.name || 'Unnamed Job',
                description: `**Schedule:** ${formatSchedule(job.schedule)}\n\n**Payload:**\n${formatPayload(job.payload)}\n\n**Status:** ${job.enabled ? 'Enabled' : 'Disabled'}`,
                status: job.enabled ? 'todo' : 'backlog',
                priority: determinePriority(job.name),
                category: determineCategory(job),
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
                dueDate
            };
        });
        
        // Read existing tasks
        const tasksFile = path.join(__dirname, 'data', 'tasks.json');
        let existingData;
        try {
            const content = await fs.readFile(tasksFile, 'utf8');
            existingData = JSON.parse(content);
        } catch (error) {
            existingData = { tasks: [], lastUpdated: new Date().toISOString() };
        }
        
        const existingTasks = existingData.tasks || [];
        
        // Keep only non-cron tasks
        const manualTasks = existingTasks.filter(t => t.source !== 'cron');
        
        // Merge
        const allTasks = [...manualTasks, ...cronTasks];
        
        // Write back
        const output = {
            tasks: allTasks,
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(tasksFile, JSON.stringify(output, null, 2));
        
        console.log(`✅ Synced ${cronTasks.length} cron tasks`);
        console.log(`📝 Kept ${manualTasks.length} manual tasks`);
        console.log(`📊 Total: ${allTasks.length} tasks`);
        
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
    }
}

function formatSchedule(schedule) {
    if (!schedule) return 'Unknown';
    if (schedule.kind === 'cron') {
        return `Cron: ${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ''}`;
    }
    if (schedule.kind === 'at') {
        return `One-time: ${new Date(schedule.atMs).toISOString()}`;
    }
    if (schedule.kind === 'every') {
        const minutes = schedule.everyMs / 60000;
        return `Every ${minutes} minutes`;
    }
    return JSON.stringify(schedule);
}

function formatPayload(payload) {
    if (!payload) return 'None';
    if (payload.kind === 'systemEvent') {
        return `System Event: ${payload.text}`;
    }
    if (payload.kind === 'agentTurn') {
        return payload.message || 'Agent task';
    }
    return JSON.stringify(payload, null, 2);
}

function determinePriority(name) {
    if (!name) return 'medium';
    const lower = name.toLowerCase();
    if (lower.includes('urgent') || lower.includes('important') || lower.includes('critical')) {
        return 'urgent';
    }
    if (lower.includes('reminder') || lower.includes('check')) {
        return 'high';
    }
    if (lower.includes('daily') || lower.includes('morning')) {
        return 'medium';
    }
    return 'low';
}

function determineCategory(job) {
    const name = (job.name || '').toLowerCase();
    const message = (job.payload?.message || '').toLowerCase();
    
    if (name.includes('sync') || name.includes('update') || name.includes('auto')) {
        return 'automation';
    }
    if (name.includes('reminder') || name.includes('medicine') || name.includes('gym')) {
        return 'maintenance';
    }
    if (name.includes('brief') || name.includes('check') || name.includes('barça')) {
        return 'communication';
    }
    return 'automation';
}

// Create wrapper for cron tool
const wrapperContent = `
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function list() {
    try {
        // Try using openclaw CLI directly
        const { stdout } = await execAsync('openclaw cron list --json');
        return JSON.parse(stdout);
    } catch (error) {
        console.error('Failed to call openclaw CLI:', error.message);
        return { jobs: [] };
    }
}

module.exports = { list };
`;

// Write wrapper
fs.writeFile(path.join(__dirname, 'cron-tool-wrapper.js'), wrapperContent)
    .then(() => syncCronJobs())
    .catch(err => {
        console.error('Failed to create wrapper:', err);
        process.exit(1);
    });
