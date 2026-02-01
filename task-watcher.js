#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TASKS_FILE = path.join(__dirname, 'tasks.json');
const LOG_FILE = path.join(__dirname, 'task-watcher.log');
const PID_FILE = path.join(__dirname, 'task-watcher.pid');

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(logMessage.trim());
}

// Load tasks from file
function loadTasks() {
  try {
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    log(`ERROR: Failed to load tasks: ${err.message}`);
    return [];
  }
}

// Track previous state
let previousTasks = {};

// Initialize previous state
function initializeState() {
  const tasks = loadTasks();
  tasks.forEach(task => {
    previousTasks[task.id] = task.status;
  });
  log(`Initialized state with ${Object.keys(previousTasks).length} tasks`);
}

// Send notification by queuing for Begubot
function sendNotification(taskTitle, status) {
  try {
    const command = `node ${path.join(__dirname, 'send-task-notification.js')} "${taskTitle}" "${status}"`;
    execSync(command, { stdio: 'pipe' });
    log(`Queued notification: ${taskTitle} (${status})`);
  } catch (err) {
    log(`ERROR: Failed to queue notification: ${err.message}`);
  }
}

// Check for status changes
function checkStatusChanges() {
  const tasks = loadTasks();
  
  tasks.forEach(task => {
    const previousStatus = previousTasks[task.id];
    const currentStatus = task.status;
    
    // Detect new task
    if (previousStatus === undefined) {
      previousTasks[task.id] = currentStatus;
      log(`New task detected: ${task.title} (${currentStatus})`);
      return;
    }
    
    // Detect status change
    if (previousStatus !== currentStatus) {
      log(`Status change: ${task.title} | ${previousStatus} → ${currentStatus}`);
      
      // Send notification if moved to "in-progress"
      if (currentStatus === 'in-progress') {
        sendNotification(task.title, 'in-progress');
      }
      
      // Also notify on completion
      if (currentStatus === 'done') {
        sendNotification(task.title, 'done');
      }
      
      // Update tracked state
      previousTasks[task.id] = currentStatus;
    }
  });
}

// Debounce mechanism
let debounceTimer = null;
function debounceCheck() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(() => {
    checkStatusChanges();
  }, 500); // 500ms debounce
}

// Start watching
function startWatcher() {
  // Check if already running
  if (fs.existsSync(PID_FILE)) {
    const oldPid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try {
      process.kill(parseInt(oldPid), 0);
      console.error(`ERROR: Watcher already running (PID: ${oldPid})`);
      process.exit(1);
    } catch {
      // Old PID is dead, clean up
      fs.unlinkSync(PID_FILE);
    }
  }
  
  // Write PID file
  fs.writeFileSync(PID_FILE, process.pid.toString());
  
  log('='.repeat(80));
  log('Task Watcher started');
  log(`PID: ${process.pid}`);
  log(`Watching: ${TASKS_FILE}`);
  log('='.repeat(80));
  
  // Initialize state
  initializeState();
  
  // Watch for file changes
  fs.watch(TASKS_FILE, (eventType, filename) => {
    if (eventType === 'change') {
      log(`File changed: ${filename}`);
      debounceCheck();
    }
  });
  
  log('Watching for task status changes...');
  log('Press Ctrl+C to stop');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...');
    cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...');
    cleanup();
    process.exit(0);
  });
}

// Stop watcher
function stopWatcher() {
  if (!fs.existsSync(PID_FILE)) {
    console.error('ERROR: No watcher process found (no PID file)');
    process.exit(1);
  }
  
  const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
  
  try {
    process.kill(parseInt(pid), 'SIGTERM');
    fs.unlinkSync(PID_FILE);
    console.log(`Stopped watcher process (PID: ${pid})`);
  } catch (err) {
    console.error(`ERROR: Failed to stop process: ${err.message}`);
    // Clean up stale PID file
    fs.unlinkSync(PID_FILE);
    process.exit(1);
  }
}

// Cleanup on exit
function cleanup() {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  log('Task Watcher stopped');
  log('='.repeat(80));
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'start':
    startWatcher();
    break;
  
  case 'stop':
    stopWatcher();
    break;
  
  case 'status':
    if (fs.existsSync(PID_FILE)) {
      const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
      try {
        process.kill(parseInt(pid), 0);
        console.log(`Watcher is running (PID: ${pid})`);
      } catch {
        console.log('Watcher is not running (stale PID file)');
        fs.unlinkSync(PID_FILE);
      }
    } else {
      console.log('Watcher is not running');
    }
    break;
  
  default:
    console.log('Task Watcher - Real-time task status monitoring');
    console.log('');
    console.log('Usage:');
    console.log('  node task-watcher.js start   - Start watching tasks.json');
    console.log('  node task-watcher.js stop    - Stop the watcher');
    console.log('  node task-watcher.js status  - Check if watcher is running');
    console.log('');
    console.log('The watcher monitors tasks.json and sends notifications when');
    console.log('tasks move to "in-progress" status via OpenClaw gateway wake.');
    process.exit(command ? 1 : 0);
}
