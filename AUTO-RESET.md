# 🔄 Daily Task Auto-Reset System

## Overview
Automatically resets daily recurring tasks at midnight, keeping the task board fresh and synced with reality.

---

## 🎯 How It Works

### 1. **Daily Tasks Tagged**
Tasks with `"daily"` tag are identified as recurring:
- Gym Session
- Medicine reminders
- GRE Words Practice
- Abs & Brush
- Isabgul
- Overnight Work Session (2 AM)
- Morning Brief

### 2. **Midnight Reset (12:01 AM IST)**
Cron job runs: `Task Manager - Reset Daily Tasks`

**What it does:**
```javascript
For each task with tag "daily":
  If status is "done":
    Move to "todo"
    Update timestamp
```

### 3. **Next Day Fresh Start**
When you wake up, daily tasks are back in "To Do" column, ready for today.

---

## 📊 Example Timeline

### Today (Feb 1):
- **7:00 PM** - Gym reminder fires
- **7:30 PM** - You go to gym, mark task as "Done" ✅
- **11:00 PM** - GRE reminder fires
- **11:30 PM** - You study, mark task as "Done" ✅

### Midnight (12:01 AM):
- 🌙 Reset script runs automatically
- ✅ "Gym Session" → Moves back to "To Do"
- ✅ "GRE Words" → Moves back to "To Do"

### Tomorrow (Feb 2):
- **7:00 PM** - Gym reminder fires again
- Task board shows: "Gym Session" in "To Do" (fresh for today)

---

## 🤖 Overnight Work Integration

### Special Handling: 2 AM Work Session
**Task:** `Overnight Work Session - 2 AM`

**Workflow:**
1. **1:59 AM** - Task is in "To Do" (reset from yesterday)
2. **2:00 AM** - Cron job fires
3. **2:00 AM** - Script marks task "In Progress" ⚡
4. **2:00-2:30 AM** - I do overnight work:
   - Scan email/WhatsApp
   - Check for uncommitted code
   - Build automations
   - Research AI news
   - Prepare morning report
5. **2:30 AM** - Script marks task "Done" ✅
6. **12:01 AM (next day)** - Reset back to "To Do"

**You can track overnight work in real-time!**

---

## 📁 Files

### `reset-daily-tasks.js`
Main reset script:
```javascript
// Reads tasks.json
// Finds tasks with "daily" tag and status "done"
// Resets them to "todo"
// Updates timestamp
```

**Run manually:**
```bash
cd /home/hyper/clawd/tools/task-manager
node reset-daily-tasks.js
```

### `update-daily-tags.js`
One-time script to tag daily tasks:
```bash
node update-daily-tags.js
```

---

## 🔧 Cron Jobs

### 1. Reset Daily Tasks (12:01 AM)
```json
{
  "name": "Task Manager - Reset Daily Tasks",
  "schedule": "1 0 * * *",
  "action": "Run reset-daily-tasks.js",
  "deliver": false
}
```

### 2. Overnight Work (2:00 AM)
```json
{
  "name": "Overnight Work Engine",
  "schedule": "0 2 * * *",
  "action": "Execute overnight work + update task status",
  "deliver": true
}
```

---

## 🏷️ Tagging System

### How to Mark a Task as Daily
Add `"daily"` to the tags array:

**Via UI:**
1. Edit task
2. Add "daily" to tags field (comma-separated)
3. Save

**Via CLI:**
```bash
./task-cli.sh update task-XXX '{"tags":["existing","daily"]}'
```

**Via API:**
```bash
curl -X PUT http://localhost:3000/api/tasks/task-XXX \
  -H "Content-Type: application/json" \
  -d '{"tags":["daily"]}'
```

---

## 📊 Current Daily Tasks

| Task | Time | Category | Priority |
|------|------|----------|----------|
| Medicine After Lunch | 1:30 PM | Communication | High |
| Gym Session | 7:00 PM | Communication | Medium |
| GRE Words Practice | 11:00 PM | Project | Medium |
| Abs & Brush | 11:30 PM | Communication | Medium |
| Isabgul | 12:00 AM | Communication | Medium |
| Overnight Work | 2:00 AM | Automation | High |
| Morning Brief | 9:00 AM | Automation | High |

---

## 🎯 Benefits

### For You:
- ✅ Always see today's pending tasks
- 📊 Track completion history (before midnight)
- 🎯 Clear view of what needs doing today
- 🔄 No manual cleanup needed

### For Me:
- 🤖 Auto-track my overnight work
- 📝 Show progress in real-time
- ✅ Mark completions automatically
- 📊 Keep task board accurate

---

## 🔍 Monitoring

### Check Reset Status
```bash
# See last reset log
cat /home/hyper/clawd/tools/task-manager/reset.log

# Check which tasks are tagged daily
curl -s http://localhost:3000/api/tasks | \
  grep -A5 '"daily"'
```

### Manual Reset (Testing)
```bash
cd /home/hyper/clawd/tools/task-manager
node reset-daily-tasks.js
```

---

## 🐛 Troubleshooting

### Tasks Not Resetting?
1. Check if task has "daily" tag
2. Verify cron job is enabled: `clawdbot cron list`
3. Check server is running: `curl localhost:3000/api/tasks`
4. Run manual reset: `node reset-daily-tasks.js`

### Want to Stop Auto-Reset?
```bash
# Disable the cron job
clawdbot cron list  # Find job ID
clawdbot cron update <job-id> --enabled false
```

### Add New Daily Task
1. Create task in UI or CLI
2. Add "daily" tag
3. It will auto-reset from next midnight

---

## 📅 Future Enhancements

Possible additions:
- [ ] Weekly task reset (Mondays)
- [ ] Monthly task reset (1st of month)
- [ ] Custom reset schedules per task
- [ ] Reset history log
- [ ] Completion streak tracking

---

## 🎉 Summary

**What happens now:**
1. ✅ You complete daily tasks during the day
2. 🌙 At midnight, they automatically reset to "To Do"
3. 🌅 Wake up to a fresh task board
4. 🔁 Repeat daily

**No manual work needed!** The task board always shows today's status.

---

*Auto-reset running since: Feb 1, 2026*  
*Next reset: Every day at 12:01 AM IST*
