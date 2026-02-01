#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Manually input cron jobs (from your screenshot + cron list)
const cronJobs = [
  { id: '1', name: 'GRE Words - 23:00', time: '23:00', daily: true, category: 'project', priority: 'medium' },
  { id: '2', name: 'Abs & Brush - 23:30', time: '23:30', daily: true, category: 'communication', priority: 'medium' },
  { id: '3', name: 'Isabgul - 00:00', time: '00:00', daily: true, category: 'communication', priority: 'medium' },
  { id: '4', name: 'Overnight Work Engine - 02:00', time: '02:00', daily: true, category: 'automation', priority: 'high' },
  { id: '5', name: 'Daily Auto-Update - 04:00', time: '04:00', daily: true, category: 'automation', priority: 'medium' },
  { id: '6', name: 'Morning Brief - 09:00', time: '09:00', daily: true, category: 'automation', priority: 'high' },
  { id: '7', name: 'Barça Match Check - 09:00', time: '09:00', daily: true, category: 'automation', priority: 'low' },
  { id: '8', name: 'NPTEL Quiz Check - 09:00 Mon', time: '09:00', daily: false, category: 'project', priority: 'medium' },
  { id: '9', name: 'Medicine After Lunch - 13:30', time: '13:30', daily: true, category: 'communication', priority: 'high' },
  { id: '10', name: 'Midday Check-In - 14:00', time: '14:00', daily: true, category: 'automation', priority: 'low' },
  { id: '11', name: 'Gym - 19:00', time: '19:00', daily: true, category: 'communication', priority: 'medium' },
  { id: '12', name: 'Sync Call (MWF) - 19:15', time: '19:15', daily: false, category: 'communication', priority: 'medium' },
  { id: '13', name: 'Vitamin D3 (Mon) - 21:30', time: '21:30', daily: false, category: 'communication', priority: 'medium' },
  { id: '14', name: 'Medicine After Dinner (Tue,Fri) - 21:30', time: '21:30', daily: false, category: 'communication', priority: 'high' },
  { id: '15', name: 'Task Manager Reset - 00:01', time: '00:01', daily: true, category: 'automation', priority: 'low' }
];

function readTasks() {
  const data = fs.readFileSync(TASKS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

console.log('🔄 Syncing cron jobs to Task Manager...\n');

const tasks = readTasks();
let added = 0;

// Remove old cron tasks
const nonCronTasks = tasks.filter(t => !t.id.startsWith('cron-'));

// Add all cron jobs
cronJobs.forEach(job => {
  const task = {
    id: `cron-${job.id}`,
    title: job.name,
    description: `Scheduled reminder at ${job.time}`,
    status: 'todo',
    priority: job.priority,
    category: job.category,
    tags: ['cron', 'automated', ...(job.daily ? ['daily'] : [])],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  nonCronTasks.push(task);
  added++;
  console.log(`✅ Added: ${job.name}`);
});

writeTasks(nonCronTasks);
console.log(`\n✨ Sync complete! Added ${added} cron job tasks`);
console.log(`   Total tasks now: ${nonCronTasks.length}`);
