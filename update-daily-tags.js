#!/usr/bin/env node
/**
 * Update Daily Task Tags
 * Ensures all daily reminder tasks have the "daily" tag
 */

const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Task IDs that are daily reminders
const DAILY_TASK_IDS = [
    'task-008', // GRE Words Practice
    'task-011', // Gym Session
    'task-012'  // Medicine After Lunch
];

// Task titles that indicate daily tasks
const DAILY_KEYWORDS = ['daily', 'gym', 'medicine', 'gre', 'abs', 'brush', 'isabgul'];

function updateDailyTags() {
    console.log('🏷️  Updating daily task tags...\n');
    
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    const tasks = JSON.parse(data);
    let updated = 0;
    
    tasks.forEach(task => {
        const shouldBeDaily = 
            DAILY_TASK_IDS.includes(task.id) ||
            DAILY_KEYWORDS.some(keyword => 
                task.title.toLowerCase().includes(keyword) ||
                (task.description && task.description.toLowerCase().includes(keyword))
            );
        
        if (shouldBeDaily) {
            if (!task.tags) task.tags = [];
            if (!task.tags.includes('daily')) {
                task.tags.push('daily');
                task.updatedAt = new Date().toISOString();
                console.log(`✅ Tagged as daily: ${task.title}`);
                updated++;
            }
        }
    });
    
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
    console.log(`\n✨ Updated ${updated} task(s) with daily tag`);
}

updateDailyTags();
