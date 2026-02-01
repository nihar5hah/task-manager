#!/usr/bin/env node
/**
 * Daily Task Reset Script
 * Resets daily recurring tasks at midnight
 */

const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, 'tasks.json');
const API_URL = 'http://localhost:3000/api/tasks';

// Helper to read tasks from file
function readTasksFromFile() {
    try {
        const data = fs.readFileSync(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading tasks file:', error);
        return [];
    }
}

// Helper to write tasks to file
function writeTasksToFile(tasks) {
    try {
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing tasks file:', error);
        return false;
    }
}

async function resetDailyTasks() {
    console.log('🌙 Daily Task Reset - Starting...\n');
    
    const tasks = readTasksFromFile();
    let resetCount = 0;
    const today = new Date().toISOString().split('T')[0];
    
    tasks.forEach(task => {
        // Check if task has "daily" tag and is marked as done
        const isDaily = task.tags && task.tags.includes('daily');
        const isDone = task.status === 'done';
        
        if (isDaily && isDone) {
            console.log(`✅ Resetting: ${task.title}`);
            task.status = 'todo';
            task.updatedAt = new Date().toISOString();
            resetCount++;
        }
    });
    
    if (resetCount > 0) {
        if (writeTasksToFile(tasks)) {
            console.log(`\n✨ Reset ${resetCount} daily task(s) for ${today}`);
            return { success: true, count: resetCount };
        } else {
            console.error('❌ Failed to save changes');
            return { success: false, error: 'Write failed' };
        }
    } else {
        console.log('ℹ️  No daily tasks needed resetting');
        return { success: true, count: 0 };
    }
}

// Run if called directly
if (require.main === module) {
    resetDailyTasks()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = { resetDailyTasks };
