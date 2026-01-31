# Task Manager v2.0

Modern task management system with auto-sync and Obsidian/Linear-inspired UI.

## Features

### Task Auto-Sync
- **Cron Integration**: Automatically pulls scheduled jobs from `clawdbot cron list`
- **Heartbeat State**: Syncs tasks from `/home/hyper/clawd/memory/heartbeat-state.json`
- **Memory Logs**: Scans daily memory logs for TODO items and checkboxes
- **Project Files**: Discovers TASK.md files in project subdirectories
- **Real-time Updates**: Background sync every 5 minutes via WebSocket
- **Auto-categorization**: Smart task categorization based on content

### Modern UI (Obsidian/Linear Style)
- **Multiple Views**: Board, List, Calendar, Graph
- **Dark Theme**: Deep dark (#1a1a1a) with subtle borders and glass-morphism
- **Smooth Animations**: Physics-based drag-and-drop, fade transitions, skeleton screens
- **Command Palette**: Quick access with Cmd+K
- **Keyboard Shortcuts**: 
  - `N` - New task
  - `Cmd/Ctrl+K` - Command palette
  - `Cmd/Ctrl+S` - Sync tasks
  - `ESC` - Close modals

### Kanban Improvements
- **Drag & Drop**: Smooth physics-based interactions
- **Inline Editing**: Click any task to edit
- **Priority Indicators**: Color-coded priority dots
- **Tags**: Multi-tag support with filtering
- **Due Dates**: Calendar integration
- **Progress Tracking**: Visual progress indicators

### Technical Stack
- **Backend**: Express.js with WebSocket (ws)
- **Frontend**: Vanilla JS with modern CSS (Grid, Flexbox)
- **Real-time**: WebSocket for live updates
- **Responsive**: Mobile-friendly design
- **Font**: Inter/SF Pro

## Installation

```bash
cd /home/hyper/clawd/tools/task-manager
npm install
npm start
```

Server runs on http://localhost:3000

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/sync` - Manual sync trigger
- `GET /api/stats` - Get statistics
- `GET /api/tasks/relationships` - Get task relationships for graph view

## Sync Sources

### 1. Cron Jobs
Tasks from `clawdbot cron list` appear as:
- Status: in-progress (if enabled) or backlog (if disabled)
- Category: automation
- Tags: cron, scheduled, recurring

### 2. Heartbeat State
Tasks from heartbeat checks:
- Status: in-progress
- Category: automation
- Tags: heartbeat, monitoring

### 3. Memory Logs
Tasks from `memory/*.md` files:
- Pattern: `TODO:`, `TASK:`, `- [ ]`
- Status: todo (or done if marked with [x])
- Category: Auto-detected from content
- Tags: memory

### 4. Project Files
Tasks from `**/TASK.md`:
- Organized by project name
- Respects section headers (# Backlog, # In Progress, etc.)
- Category: project
- Tags: project name

## Deployment

Deploy to Vercel:
```bash
vercel --prod
```

The app uses WebSocket for real-time updates. Vercel supports WebSocket connections.

## File Structure

```
task-manager/
├── server.js              # Express + WebSocket server
├── sync-manager.js        # Task sync engine
├── public/
│   ├── index.html         # Main UI
│   ├── css/
│   │   └── style.css      # Modern dark theme
│   └── js/
│       └── app.js         # Frontend application
├── data/
│   ├── tasks.json         # Task storage
│   └── config.json        # Configuration
└── package.json
```

## Task Schema

```json
{
  "id": "uuid",
  "title": "Task title",
  "description": "Markdown supported",
  "status": "backlog|todo|in-progress|done",
  "priority": "low|medium|high|urgent",
  "category": "automation|project|communication|maintenance",
  "source": "manual|cron|heartbeat|memory|project",
  "tags": ["tag1", "tag2"],
  "dueDate": "2024-01-31",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "completedAt": "ISO 8601",
  "metadata": {},
  "dependencies": ["task-id"],
  "subtasks": []
}
```

## Development

Run in development mode:
```bash
npm run dev
```

The server will:
- Start on port 3000
- Run initial sync after 10 seconds
- Auto-sync every 5 minutes
- Broadcast updates via WebSocket

## License

ISC
