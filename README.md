# Task Manager - Kanban Board System

A clean, minimal task management system with Kanban board interface, designed for tracking automated tasks, projects, and action items with seamless integration into existing workflows.

## Features

### Core Functionality
- **Kanban Board Interface**: 4-column board (Backlog / To Do / In Progress / Done)
- **Drag & Drop**: Move tasks between columns with smooth drag-and-drop
- **Task Management**: Full CRUD operations for tasks
- **Real-time Stats**: Live statistics and completion tracking
- **Smart Filtering**: Search, filter by category and priority
- **Dark Mode**: Beautiful dark theme with system preference detection

### Task Properties
- Title and description
- Status (backlog, todo, in-progress, done)
- Priority levels (low, medium, high, urgent)
- Categories (automation, project, communication, maintenance)
- Source tracking (manual, cron, conversation, email)
- Timestamps (created, updated, completed)
- Custom metadata

### Integration Features
- **Cron Job Sync**: Automatically create tasks from cron jobs
- **Log Parsing**: Extract TODO/FIXME items from logs
- **Git Integration**: Track completed work from commits
- **Auto-sync**: Periodic background synchronization

## Quick Start

### 1. Installation

The system is already set up with all dependencies installed. If starting fresh:

```bash
cd /home/hyper/clawd/tools/task-manager
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start on http://localhost:3000

### 3. Access the UI

Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Adding Tasks

1. Click the "+ Add Task" button
2. Fill in the task details
3. Click "Save Task"

Or use the API:
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Task",
    "description": "Task details here",
    "status": "todo",
    "priority": "high",
    "category": "project"
  }'
```

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus search
- `Ctrl/Cmd + N` - Add new task
- `Ctrl/Cmd + R` - Refresh tasks
- `ESC` - Close modal

### Filtering Tasks

Use the filter bar to:
- Search by title/description
- Filter by category
- Filter by priority

### Moving Tasks

Drag and drop task cards between columns to change their status.

## Integration Scripts

### Sync Cron Jobs

Automatically create tasks from your cron jobs:

```bash
./scripts/sync-cron.sh
```

This will:
- Read your crontab
- Create tasks for each cron job
- Avoid duplicates
- Track schedule and command details

### Parse Logs

Extract action items from logs:

```bash
./scripts/parse-logs.sh
```

Searches for patterns like:
- `TODO:`
- `FIXME:`
- `ACTION:`
- `TASK:`
- `BUG:`

### Auto-Update

Run both sync operations:

```bash
./scripts/auto-update.sh
```

**Add to crontab for automatic syncing:**
```bash
# Run every 30 minutes
*/30 * * * * /home/hyper/clawd/tools/task-manager/scripts/auto-update.sh >> /tmp/task-manager-sync.log 2>&1
```

## API Endpoints

### Tasks

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/bulk-update` - Bulk update tasks

### Statistics

- `GET /api/stats` - Get task statistics

### Configuration

- `GET /api/config` - Get system configuration

## File Structure

```
task-manager/
├── README.md                 # This file
├── package.json             # Node.js dependencies
├── server.js                # Express API server
├── data/
│   ├── tasks.json          # Task storage
│   └── config.json         # Configuration
├── public/
│   ├── index.html          # Main UI
│   ├── css/
│   │   └── style.css       # Styling
│   └── js/
│       ├── app.js          # Main application logic
│       └── kanban.js       # Kanban board functionality
└── scripts/
    ├── sync-cron.sh        # Sync cron jobs
    ├── parse-logs.sh       # Parse logs for tasks
    └── auto-update.sh      # Run all sync operations
```

## Data Storage

Tasks are stored in `data/tasks.json` as a simple JSON file. No database required for MVP.

### Task Schema

```json
{
  "id": "uuid",
  "title": "Task name",
  "description": "Details",
  "status": "backlog|todo|in-progress|done",
  "priority": "low|medium|high|urgent",
  "category": "automation|project|communication|maintenance",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "completedAt": "timestamp",
  "source": "cron|manual|conversation|email",
  "metadata": {}
}
```

## Customization

### Categories

Edit `data/config.json` to add/modify categories:

```json
{
  "categories": [
    "automation",
    "project",
    "communication",
    "maintenance",
    "your-category"
  ]
}
```

### Priorities

Modify priority levels in `data/config.json`:

```json
{
  "priorities": [
    "low",
    "medium",
    "high",
    "urgent",
    "critical"
  ]
}
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Port Configuration

Change the port by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Troubleshooting

### Server won't start

Check if port 3000 is already in use:
```bash
lsof -i :3000
```

### Tasks not loading

1. Check if `data/tasks.json` exists and is valid JSON
2. Verify server is running: `curl http://localhost:3000/api/tasks`
3. Check browser console for errors

### Cron sync not working

1. Ensure scripts have execute permissions: `chmod +x scripts/*.sh`
2. Check if `jq` is installed: `sudo apt install jq`
3. Verify API is accessible: `curl http://localhost:3000/api/tasks`

## Future Enhancements (Phase 2)

- [ ] Task dependencies
- [ ] Time tracking
- [ ] Pomodoro timer integration
- [ ] Voice input via Telegram
- [ ] AI-powered task prioritization
- [ ] WhatsApp/Email integration
- [ ] Weekly/monthly analytics
- [ ] Export to PDF/Markdown
- [ ] Multi-user support
- [ ] Task comments and history
- [ ] File attachments
- [ ] Recurring tasks

## Technical Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no framework overhead)
- **Storage**: File-based JSON (portable, simple)
- **Styling**: Custom CSS with dark mode
- **Integration**: Bash scripts for automation

## License

ISC

## Contributing

This is a personal productivity tool. Feel free to fork and customize for your needs.

## Support

For issues or questions, create an issue in the project repository.

---

**Built with ❤️ for productivity and automation**

Last Updated: 2026-01-31
