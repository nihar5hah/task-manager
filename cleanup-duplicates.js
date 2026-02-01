#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, 'tasks.json');

function readTasks() {
  return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

console.log('🧹 Cleaning up duplicate tasks...\n');

const tasks = readTasks();

// IDs to remove (manual duplicates of cron jobs)
const toRemove = [
  'task-004', // Morning Brief Automation (duplicate of cron)
  'task-008', // GRE Words Practice (duplicate of cron)
  'task-011', // Gym Session (duplicate of cron)
  'task-012', // Medicine After Lunch (duplicate of cron)
  '700c8c23-54bb-4065-8a88-d06e25ccc8bc' // Overnight Work Session (duplicate of cron)
];

const cleaned = tasks.filter(t => !toRemove.includes(t.id));

console.log(`Removed ${tasks.length - cleaned.length} duplicate tasks:`);
toRemove.forEach(id => {
  const task = tasks.find(t => t.id === id);
  if (task) console.log(`  ❌ ${task.title}`);
});

writeTasks(cleaned);
console.log(`\n✨ Cleanup complete! Total tasks: ${cleaned.length}`);
