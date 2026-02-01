# Task Manager 📋

Modern Kanban task manager with **Obsidian/Linear-inspired UI**, auto-sync with cron jobs, and WebSocket live updates.

![Task Manager](https://img.shields.io/badge/status-active-success)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue)

## ✨ Features

### 🎨 Multiple Views
- **Kanban Board** - Drag-and-drop columns (Backlog → To Do → In Progress → Done)
- **List View** - Sortable table with all task details
- **Calendar View** - Due date visualization with month navigation
- **Graph View** - Dependency and relationship visualization
- **Analytics Dashboard** - Task completion stats and charts

### 🚀 Core Features
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- 🔄 Auto-sync with cron jobs
- 🎯 Priority levels (Urgent, High, Medium, Low)
- 🏷️ Categories and tags
- 📅 Due dates
- 🔍 Real-time search
- 🎨 Dark/Light mode toggle
- ⌨️ Keyboard shortcuts
- 📦 Bulk operations (select multiple, update status, delete)
- 💾 Export tasks (JSON, CSV)
- 🎨 Beautiful, responsive UI

### ⚡ Tech Stack
- **Backend**: Node.js + Express
- **Storage**: File-based JSON (no database needed!)
- **Frontend**: Vanilla JavaScript (no framework bloat)
- **Styling**: Custom CSS with CSS variables
- **Icons**: Feather Icons (SVG)

## 🛠️ Installation

```bash
# Clone the repo
git clone https://github.com/nihar5hah/task-manager.git
cd task-manager

# Install dependencies
npm install

# Start the server
npm start
```

Server runs on **http://localhost:3000**

## 📖 Usage

### Web Interface
1. Open http://localhost:3000 in your browser
2. Click **+ New Task** to create tasks
3. Drag tasks between columns
4. Click any task to edit details
5. Use filters and search to find tasks

### API Endpoints

**Get all tasks**
```bash
GET /api/tasks
```

**Create task**
```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "My Task",
  "description": "Task details",
  "status": "todo",
  "priority": "high",
  "category": "project",
  "dueDate": "2026-02-15",
  "tags": ["urgent", "backend"]
}
```

**Update task**
```bash
PUT /api/tasks/:id
Content-Type: application/json

{
  "status": "done"
}
```

**Delete task**
```bash
DELETE /api/tasks/:id
```

**Bulk update**
```bash
POST /api/tasks/bulk-update
Content-Type: application/json

{
  "ids": ["id1", "id2"],
  "updates": {"status": "in-progress"}
}
```

**Bulk delete**
```bash
DELETE /api/tasks/bulk-delete
Content-Type: application/json

{
  "ids": ["id1", "id2"]
}
```

**Sync with cron jobs**
```bash
POST /api/sync
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `N` | New task |
| `B` | Toggle bulk select mode |
| `Cmd/Ctrl + E` | Export tasks |
| `/` | Focus search |
| `Esc` | Close modals |

## 🎨 UI Features

- **Drag & Drop**: Move tasks between columns
- **Inline editing**: Click to edit task details
- **Real-time updates**: Changes sync instantly
- **Responsive design**: Works on desktop, tablet, mobile
- **Dark mode**: Eye-friendly interface
- **Smooth animations**: Polished interactions

## 📦 File Structure

```
task-manager/
├── public/
│   ├── css/
│   │   └── style.css          # All styling
│   ├── js/
│   │   └── app.js             # Frontend logic
│   └── index.html             # Main UI
├── server.js                  # Express server + API
├── tasks.json                 # Task storage (auto-created)
└── package.json
```

## 🔄 Integration

### With Cron Jobs
The `/api/sync` endpoint can pull tasks from your cron configuration:

```bash
curl -X POST http://localhost:3000/api/sync
```

### With Other Tools
Export tasks as JSON and pipe to other tools:

```bash
curl http://localhost:3000/api/tasks | your-tool
```

## 🤝 Contributing

Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📝 License

ISC License - feel free to use this however you want!

## 🚀 Roadmap

- [ ] WebSocket support for real-time multi-user sync
- [ ] Task dependencies and relationships
- [ ] Time tracking
- [ ] Comments and attachments
- [ ] Mobile app
- [ ] API authentication

---

Built with ❤️ for productive task management
