# Task: Build Task Management System

Build a complete Task Management System per the spec at `/home/hyper/clawd/projects/task-manager-spec.md`.

## MVP Requirements:
1. Kanban board with 4 columns: Backlog / To Do / In Progress / Done
2. CRUD operations for tasks
3. File-based storage (tasks.json)
4. Node.js + Express backend
5. Clean, minimal web UI (HTML/CSS/JS)
6. Sync with cron jobs (use 'openclaw' commands, NOT 'clawdbot')
7. Basic drag-and-drop or click-to-move task status

## Technical Stack:
- Backend: Node.js + Express
- Storage: JSON files (no database)
- Frontend: Vanilla JS or lightweight framework
- Port: 3000 or any available

## File Structure:
```
task-manager/
├── package.json
├── server.js
├── data/
│   └── tasks.json
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
└── scripts/
    └── sync-cron.sh
```

## Integration:
- Parse output from: `openclaw cron list --json`
- Create tasks for each cron job
- Update task status based on execution

Focus on functionality first, polish later. Make it work tonight!
