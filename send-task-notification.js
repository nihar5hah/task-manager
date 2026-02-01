#!/usr/bin/env node

// Simple wrapper to send task notifications via OpenClaw session
// Usage: node send-task-notification.js "Task title" "status"

const taskTitle = process.argv[2];
const status = process.argv[3] || 'in-progress';

if (!taskTitle) {
  console.error('Usage: node send-task-notification.js "Task title" [status]');
  process.exit(1);
}

// Construct message based on status
let emoji = '🚀';
let action = 'started';

switch (status) {
  case 'in-progress':
    emoji = '🚀';
    action = 'started';
    break;
  case 'done':
    emoji = '✅';
    action = 'completed';
    break;
  case 'blocked':
    emoji = '⚠️';
    action = 'blocked';
    break;
}

const message = `${emoji} Task ${action}: ${taskTitle}`;

// Write to a notification queue file that Begubot can monitor
const fs = require('fs');
const path = require('path');
const notificationFile = path.join(__dirname, 'task-notifications.queue');

const notification = {
  timestamp: new Date().toISOString(),
  taskTitle,
  status,
  message
};

// Append to queue file
fs.appendFileSync(notificationFile, JSON.stringify(notification) + '\n');

console.log(`Queued notification: ${message}`);
