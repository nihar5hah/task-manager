// Task Manager App
class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.currentView = 'board';
        this.currentFilter = { status: '', priority: '', category: '', search: '' };
        this.ws = null;
        this.draggedTask = null;
        
        this.init();
    }

    async init() {
        this.setupWebSocket();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        await this.loadTasks();
        this.render();
    }

    // WebSocket Connection
    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('[WebSocket] Connected');
            this.updateConnectionStatus(true);
        };
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('[WebSocket] Message:', message);
            
            if (message.type === 'tasks_updated') {
                this.tasks = message.tasks;
                this.applyFilters();
                this.render();
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('[WebSocket] Error:', error);
            this.updateConnectionStatus(false);
        };
        
        this.ws.onclose = () => {
            console.log('[WebSocket] Disconnected');
            this.updateConnectionStatus(false);
            // Reconnect after 3 seconds
            setTimeout(() => this.setupWebSocket(), 3000);
        };
    }

    updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        if (statusDot) {
            statusDot.classList.toggle('connected', connected);
        }
    }

    // Event Listeners
    setupEventListeners() {
        // View switching
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Category filter
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const category = item.dataset.category;
                this.currentFilter.category = category;
                this.applyFilters();
                this.render();
            });
        });

        // Status filter
        document.querySelectorAll('.filter-chip[data-filter="status"]').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip[data-filter="status"]').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilter.status = chip.dataset.value;
                this.applyFilters();
                this.render();
            });
        });

        // Priority filter
        document.querySelectorAll('.filter-chip[data-filter="priority"]').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                this.currentFilter.priority = chip.classList.contains('active') ? chip.dataset.value : '';
                this.applyFilters();
                this.render();
            });
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.currentFilter.search = e.target.value.toLowerCase();
            this.applyFilters();
            this.render();
        });

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // Sync button
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncTasks();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            document.documentElement.classList.toggle('light');
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        document.getElementById('deleteTaskBtn').addEventListener('click', () => {
            this.deleteTask();
        });

        // Modal backdrop click
        document.querySelector('#taskModal .modal-backdrop').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.querySelector('#commandPalette .modal-backdrop').addEventListener('click', () => {
            this.closeCommandPalette();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K for command palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.openCommandPalette();
            }

            // N for new task
            if (e.key === 'n' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.openTaskModal();
            }

            // ESC to close modals
            if (e.key === 'Escape') {
                this.closeTaskModal();
                this.closeCommandPalette();
            }

            // Cmd/Ctrl + S to sync
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                this.syncTasks();
            }
        });
    }

    // API Methods
    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            this.tasks = await response.json();
            this.applyFilters();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showToast('Failed to load tasks', 'error');
        }
    }

    async saveTask() {
        const id = document.getElementById('taskId').value;
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value,
            dueDate: document.getElementById('taskDueDate').value || null,
            tags: document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t)
        };

        try {
            const url = id ? `/api/tasks/${id}` : '/api/tasks';
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                this.showToast(id ? 'Task updated' : 'Task created', 'success');
                this.closeTaskModal();
                await this.loadTasks();
                this.render();
            }
        } catch (error) {
            console.error('Error saving task:', error);
            this.showToast('Failed to save task', 'error');
        }
    }

    async deleteTask() {
        const id = document.getElementById('taskId').value;
        if (!id) return;

        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if (response.ok) {
                this.showToast('Task deleted', 'success');
                this.closeTaskModal();
                await this.loadTasks();
                this.render();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showToast('Failed to delete task', 'error');
        }
    }

    async syncTasks() {
        const syncBtn = document.getElementById('syncBtn');
        syncBtn.classList.add('syncing');
        
        try {
            const response = await fetch('/api/sync', { method: 'POST' });
            const result = await response.json();
            
            this.showToast(`Synced ${result.synced} tasks`, 'success');
            await this.loadTasks();
            this.render();
        } catch (error) {
            console.error('Error syncing tasks:', error);
            this.showToast('Sync failed', 'error');
        } finally {
            syncBtn.classList.remove('syncing');
        }
    }

    // UI Methods
    switchView(view) {
        this.currentView = view;
        
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Update views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `${view}View`);
        });

        this.render();
    }

    applyFilters() {
        this.filteredTasks = this.tasks.filter(task => {
            if (this.currentFilter.status && task.status !== this.currentFilter.status) return false;
            if (this.currentFilter.priority && task.priority !== this.currentFilter.priority) return false;
            if (this.currentFilter.category && task.category !== this.currentFilter.category) return false;
            if (this.currentFilter.search) {
                const search = this.currentFilter.search;
                return task.title.toLowerCase().includes(search) ||
                       (task.description && task.description.toLowerCase().includes(search)) ||
                       (task.tags && task.tags.some(t => t.toLowerCase().includes(search)));
            }
            return true;
        });

        this.updateCategoryCounts();
    }

    updateCategoryCounts() {
        const counts = {
            all: this.tasks.length,
            automation: this.tasks.filter(t => t.category === 'automation').length,
            project: this.tasks.filter(t => t.category === 'project').length,
            communication: this.tasks.filter(t => t.category === 'communication').length,
            maintenance: this.tasks.filter(t => t.category === 'maintenance').length
        };

        Object.entries(counts).forEach(([key, count]) => {
            const el = document.getElementById(`count-${key}`);
            if (el) el.textContent = count;
        });
    }

    render() {
        if (this.currentView === 'board') {
            this.renderBoard();
        } else if (this.currentView === 'list') {
            this.renderList();
        } else if (this.currentView === 'calendar') {
            this.renderCalendar();
        } else if (this.currentView === 'graph') {
            this.renderGraph();
        }
    }

    renderBoard() {
        const statuses = ['backlog', 'todo', 'in-progress', 'done'];
        
        statuses.forEach(status => {
            const container = document.getElementById(`${status}-tasks`);
            const tasks = this.filteredTasks.filter(t => t.status === status);
            
            // Update count
            const column = container.closest('.kanban-column');
            const countEl = column.querySelector('.column-count');
            if (countEl) countEl.textContent = tasks.length;
            
            container.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');
            
            // Setup drag and drop
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                container.classList.add('drag-over');
            });

            container.addEventListener('dragleave', () => {
                container.classList.remove('drag-over');
            });

            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.classList.remove('drag-over');
                if (this.draggedTask) {
                    this.updateTaskStatus(this.draggedTask, status);
                }
            });
        });

        // Setup task card events
        document.querySelectorAll('.task-card').forEach(card => {
            card.draggable = true;
            
            card.addEventListener('dragstart', (e) => {
                this.draggedTask = card.dataset.id;
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.draggedTask = null;
            });

            card.addEventListener('click', () => {
                const task = this.tasks.find(t => t.id === card.dataset.id);
                if (task) this.openTaskModal(task);
            });
        });
    }

    createTaskCard(task) {
        const tags = task.tags || [];
        const tagsHtml = tags.slice(0, 3).map(tag => 
            `<span class="task-tag">${tag}</span>`
        ).join('');

        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        
        return `
            <div class="task-card" data-id="${task.id}">
                <div class="task-priority ${task.priority}"></div>
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${task.source ? `<span class="task-source">${task.source}</span>` : ''}
                    ${tagsHtml}
                    ${dueDate ? `<span class="task-date">${dueDate}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderList() {
        const tbody = document.getElementById('listViewBody');
        tbody.innerHTML = this.filteredTasks.map(task => `
            <tr data-id="${task.id}" onclick="app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                <td>
                    <div class="task-priority ${task.priority}"></div>
                </td>
                <td>
                    <strong>${this.escapeHtml(task.title)}</strong>
                    ${task.description ? `<br><small style="color: var(--text-tertiary)">${this.escapeHtml(task.description.substring(0, 60))}...</small>` : ''}
                </td>
                <td><span class="status-badge ${task.status}">${task.status.replace('-', ' ')}</span></td>
                <td><span class="priority-badge ${task.priority}">${task.priority}</span></td>
                <td><span class="category-badge">${task.category}</span></td>
                <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
            </tr>
        `).join('');
    }

    renderCalendar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        document.getElementById('calendarMonth').textContent = 
            new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        
        // Add day headers
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            header.style.cssText = 'padding: 8px; text-align: center; font-weight: 600; background: var(--bg-tertiary);';
            grid.appendChild(header);
        });
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }
        
        // Add days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const tasksForDay = this.filteredTasks.filter(t => 
                t.dueDate && t.dueDate.startsWith(dateStr)
            );
            
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            if (day === now.getDate() && month === now.getMonth()) {
                dayEl.classList.add('today');
            }
            
            dayEl.innerHTML = `
                <div class="calendar-day-number">${day}</div>
                ${tasksForDay.slice(0, 3).map(t => 
                    `<div class="calendar-task" style="font-size: 10px; padding: 2px 4px; background: var(--bg-tertiary); margin: 2px 0; border-radius: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(t.title)}</div>`
                ).join('')}
            `;
            
            grid.appendChild(dayEl);
        }
    }

    async renderGraph() {
        const canvas = document.getElementById('graphCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Simple force-directed graph
        const nodes = this.filteredTasks.map((task, i) => ({
            id: task.id,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: 0,
            vy: 0,
            task: task
        }));
        
        // Clear canvas
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary');
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw nodes
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
            
            // Color by priority
            const colors = {
                urgent: '#ef4444',
                high: '#f97316',
                medium: '#eab308',
                low: '#22c55e'
            };
            ctx.fillStyle = colors[node.task.priority] || '#6366f1';
            ctx.fill();
            
            // Draw label
            ctx.fillStyle = '#e4e4e7';
            ctx.font = '10px Inter';
            ctx.fillText(node.task.title.substring(0, 20), node.x + 12, node.y + 4);
        });
    }

    async updateTaskStatus(taskId, newStatus) {
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            await this.loadTasks();
            this.render();
        } catch (error) {
            console.error('Error updating task:', error);
            this.showToast('Failed to update task', 'error');
        }
    }

    openTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const deleteBtn = document.getElementById('deleteTaskBtn');
        
        if (task) {
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskDueDate').value = task.dueDate || '';
            document.getElementById('taskTags').value = (task.tags || []).join(', ');
            deleteBtn.style.display = 'block';
        } else {
            document.getElementById('modalTitle').textContent = 'New Task';
            form.reset();
            document.getElementById('taskId').value = '';
            deleteBtn.style.display = 'none';
        }
        
        modal.classList.add('active');
        setTimeout(() => document.getElementById('taskTitle').focus(), 100);
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
    }

    openCommandPalette() {
        const modal = document.getElementById('commandPalette');
        modal.classList.add('active');
        
        const input = document.getElementById('commandInput');
        input.value = '';
        input.focus();
        
        this.updateCommandResults('');
        
        input.oninput = (e) => this.updateCommandResults(e.target.value);
    }

    closeCommandPalette() {
        document.getElementById('commandPalette').classList.remove('active');
    }

    updateCommandResults(query) {
        const results = document.getElementById('commandResults');
        const tasks = this.tasks.filter(t => 
            t.title.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        
        results.innerHTML = tasks.map(task => `
            <div class="command-item" onclick="app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                <strong>${this.escapeHtml(task.title)}</strong><br>
                <small style="color: var(--text-tertiary)">${task.status} • ${task.priority}</small>
            </div>
        `).join('') || '<div class="command-item">No tasks found</div>';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TaskManager();
});
