# Quick Start Guide 🚀

Get your Task Manager running in 60 seconds!

## Installation

```bash
cd /home/hyper/clawd/tools/task-manager
npm install
npm start
```

**Server starts at:** http://localhost:3000

---

## Using the Web Interface

### 1. Open in Browser
```
http://localhost:3000
```

### 2. Create Your First Task
1. Click **"+ New Task"** button (top right)
2. Fill in the form:
   - **Title** (required): What needs to be done?
   - **Description**: More details (supports Markdown!)
   - **Status**: Backlog / To Do / In Progress / Done
   - **Priority**: Low / Medium / High / Urgent
   - **Category**: Project / Automation / Communication / Maintenance
   - **Due Date**: Optional deadline
   - **Tags**: Comma-separated (e.g., `urgent, backend, api`)
3. Click **Save**

### 3. Manage Tasks
- **Edit:** Click any task card
- **Move:** Drag & drop between columns (Board view)
- **Delete:** Open task → Click "Delete" button
- **Search:** Use search bar at top (Cmd+K for command palette)
- **Filter:** Click filter chips below search bar

### 4. Switch Views
Use the sidebar to switch between:
- 📋 **Board** - Kanban columns
- 📝 **List** - Table view
- 📅 **Calendar** - Due date visualization
- 🔗 **Graph** - Relationship diagram
- 📊 **Analytics** - Stats and charts

### 5. Bulk Operations
1. Click the **checkbox icon** (top right) to enter bulk select mode
2. Click tasks to select them
3. Use the toolbar buttons to:
   - Move selected tasks to a status
   - Delete multiple tasks at once
4. Click checkbox icon again to exit

### 6. Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `N` | New task |
| `B` | Bulk select mode |
| `Cmd+K` | Command palette |
| `Cmd+E` | Export tasks |
| `/` | Search |
| `Esc` | Close modal |

---

## Using the API

### Create a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build API integration",
    "status": "todo",
    "priority": "high",
    "category": "project"
  }'
```

### Get All Tasks
```bash
curl http://localhost:3000/api/tasks
```

### Update a Task
```bash
# Get task ID from the list first
curl -X PUT http://localhost:3000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

### Delete a Task
```bash
curl -X DELETE http://localhost:3000/api/tasks/TASK_ID
```

### Bulk Update (Move multiple tasks)
```bash
curl -X POST http://localhost:3000/api/tasks/bulk-update \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["id1", "id2", "id3"],
    "updates": {"status": "in-progress"}
  }'
```

### Bulk Delete
```bash
curl -X DELETE http://localhost:3000/api/tasks/bulk-delete \
  -H "Content-Type: application/json" \
  -d '{"ids": ["id1", "id2", "id3"]}'
```

---

## Integration Examples

### Create Task from Shell Script
```bash
#!/bin/bash
# create-task.sh

TITLE="$1"
PRIORITY="${2:-medium}"

curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"$TITLE\",
    \"status\": \"todo\",
    \"priority\": \"$PRIORITY\",
    \"category\": \"automation\"
  }" | jq '.id'
```

Usage:
```bash
./create-task.sh "Fix production bug" "urgent"
```

### Sync with Cron Jobs
```bash
# Trigger sync
curl -X POST http://localhost:3000/api/sync
```

### Export Tasks
```bash
# Save to file
curl http://localhost:3000/api/tasks > tasks-backup.json

# Pretty print
curl http://localhost:3000/api/tasks | jq '.'
```

### Get Tasks by Status
```bash
# Using jq to filter
curl -s http://localhost:3000/api/tasks | \
  jq '.[] | select(.status == "todo")'
```

### Get High Priority Tasks
```bash
curl -s http://localhost:3000/api/tasks | \
  jq '.[] | select(.priority == "high" or .priority == "urgent")'
```

---

## Tips & Tricks

### 1. Dark Mode
Click the 🌙 moon icon in the top right

### 2. Quick Search
Press `/` to instantly focus the search bar

### 3. Command Palette
Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to open the command palette for quick actions

### 4. Drag & Drop
In Board view, drag tasks between columns to change their status instantly

### 5. Categories
Use the sidebar to filter by category:
- 🤖 Automation - Scheduled tasks, cron jobs
- 🚀 Projects - Development work
- 💬 Communication - Emails, messages
- 🔧 Maintenance - System upkeep

### 6. Export Before Major Changes
Click the export icon before doing bulk operations:
```bash
# Or via CLI
curl http://localhost:3000/api/tasks > backup-$(date +%Y%m%d).json
```

---

## Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process
kill -9 $(lsof -t -i:3000)

# Restart
npm start
```

### Tasks not saving
- Check file permissions on `tasks.json`
- Ensure disk space is available
- Check server logs for errors

### Can't create tasks
- Check browser console for errors (F12)
- Verify server is running on port 3000
- Test API directly: `curl http://localhost:3000/api/tasks`

---

## Next Steps

1. ✅ **Create your first task**
2. ✅ **Try different views**
3. ✅ **Set up keyboard shortcuts**
4. 📚 **Read the full README** for advanced features
5. 🔗 **Check the GitHub repo** for updates

---

**Happy task managing! 🎉**

For more details, see:
- [README.md](README.md) - Full documentation
- [TEST-REPORT.md](TEST-REPORT.md) - Test results
- **GitHub:** https://github.com/nihar5hah/task-manager
