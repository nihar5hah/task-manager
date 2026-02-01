// Enhanced app.js with Calendar, Graph, and Analytics views

class TaskManager {
    constructor() {
        this.tasks = [];
        this.filters = {
            status: '',
            priority: '',
            category: '',
            recurring: '',
            search: ''
        };
        this.currentView = 'board';
        this.bulkSelectMode = false;
        this.selectedTasks = new Set();
        this.currentMonth = new Date();
        this.init();
    }

    async init() {
        console.log('Initializing Task Manager...');
        await this.loadTasks();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.render();
    }

    setupEventListeners() {
        // Add Task Button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // Close Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // Cancel Button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // Form Submit
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Delete Task
        document.getElementById('deleteTaskBtn').addEventListener('click', () => {
            this.deleteTask();
        });

        // Search Input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.render();
        });

        // Filter Chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                const value = e.target.dataset.value;
                
                // Remove active from siblings
                e.target.parentElement.querySelectorAll('.filter-chip').forEach(c => {
                    c.classList.remove('active');
                });
                
                // Add active to clicked
                e.target.classList.add('active');
                
                this.filters[filter] = value;
                this.render();
            });
        });

        // View Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
                // Close sidebar on mobile after selection
                this.closeSidebar();
            });
        });

        // Category Filters
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filters.category = category;
                this.render();
                // Close sidebar on mobile after selection
                this.closeSidebar();
            });
        });

        // Sync Button
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncTasks();
        });

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Sidebar Toggle (Mobile)
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Sidebar Overlay Click
        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            this.closeSidebar();
        });

        // Calendar Navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.renderCalendarView();
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.renderCalendarView();
        });

        // Modal backdrop click
        document.querySelector('#taskModal .modal-backdrop').addEventListener('click', () => {
            this.closeTaskModal();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modal or sidebar
            if (e.key === 'Escape') {
                const modal = document.getElementById('taskModal');
                const sidebar = document.getElementById('sidebar');

                if (modal.classList.contains('active')) {
                    this.closeTaskModal();
                } else if (sidebar.classList.contains('open')) {
                    this.closeSidebar();
                }
            }

            // Cmd/Ctrl + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }

            // Cmd/Ctrl + N for new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openTaskModal();
            }
        });
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Failed to load tasks');
            this.tasks = await response.json();
            console.log('Loaded tasks:', this.tasks.length);
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showToast('Failed to load tasks', 'error');
        }
    }

    async saveTask() {
        const id = document.getElementById('taskId').value;
        const task = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value,
            dueDate: document.getElementById('taskDueDate').value,
            tags: document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t)
        };

        try {
            let response;
            if (id) {
                // Update existing task
                response = await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                });
            } else {
                // Create new task
                response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                });
            }

            if (!response.ok) throw new Error('Failed to save task');

            await this.loadTasks();
            this.render();
            this.closeTaskModal();
            this.showToast(id ? 'Task updated' : 'Task created', 'success');
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
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete task');

            await this.loadTasks();
            this.render();
            this.closeTaskModal();
            this.showToast('Task deleted', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showToast('Failed to delete task', 'error');
        }
    }

    async syncTasks() {
        try {
            this.showToast('Syncing tasks...', 'info');
            const response = await fetch('/api/sync', {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to sync tasks');

            await this.loadTasks();
            this.render();
            this.showToast('Tasks synced successfully', 'success');
        } catch (error) {
            console.error('Error syncing tasks:', error);
            this.showToast('Failed to sync tasks', 'error');
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
            document.getElementById('taskTags').value = task.tags ? task.tags.join(', ') : '';
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

    switchView(view) {
        this.currentView = view;
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Update views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `${view}View`);
        });

        this.render();
    }

    toggleTheme() {
        document.documentElement.classList.toggle('dark');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const isOpen = sidebar.classList.toggle('open');
        overlay.classList.toggle('active');

        // Prevent body scroll on mobile when sidebar is open
        if (window.innerWidth <= 768) {
            document.body.classList.toggle('sidebar-open', isOpen);
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');

        // Re-enable body scroll
        document.body.classList.remove('sidebar-open');
    }

    toggleBulkSelectMode() {
        this.bulkSelectMode = !this.bulkSelectMode;
        this.selectedTasks.clear();
        document.getElementById('bulkToolbar').style.display = this.bulkSelectMode ? 'flex' : 'none';
        this.render();
    }

    selectAllTasks() {
        this.getFilteredTasks().forEach(task => this.selectedTasks.add(task.id));
        this.updateBulkUI();
        this.render();
    }

    deselectAllTasks() {
        this.selectedTasks.clear();
        this.updateBulkUI();
        this.render();
    }

    async bulkUpdateStatus(status) {
        const taskIds = Array.from(this.selectedTasks);
        if (taskIds.length === 0) return;

        try {
            const response = await fetch('/api/tasks/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskIds, updates: { status } })
            });

            if (!response.ok) throw new Error('Failed to bulk update');

            await this.loadTasks();
            this.selectedTasks.clear();
            this.updateBulkUI();
            this.render();
            this.showToast(`Updated ${taskIds.length} tasks`, 'success');
        } catch (error) {
            console.error('Error bulk updating:', error);
            this.showToast('Failed to update tasks', 'error');
        }
    }

    async bulkDelete() {
        const taskIds = Array.from(this.selectedTasks);
        if (taskIds.length === 0) return;

        if (!confirm(`Delete ${taskIds.length} tasks?`)) return;

        try {
            await Promise.all(taskIds.map(id => 
                fetch(`/api/tasks/${id}`, { method: 'DELETE' })
            ));

            await this.loadTasks();
            this.selectedTasks.clear();
            this.updateBulkUI();
            this.render();
            this.showToast(`Deleted ${taskIds.length} tasks`, 'success');
        } catch (error) {
            console.error('Error bulk deleting:', error);
            this.showToast('Failed to delete tasks', 'error');
        }
    }

    updateBulkUI() {
        document.getElementById('selectedCount').textContent = this.selectedTasks.size;
    }

    getFilteredTasks() {
        return this.tasks.filter(task => {
            if (this.filters.status && task.status !== this.filters.status) return false;
            if (this.filters.priority && task.priority !== this.filters.priority) return false;
            if (this.filters.category && task.category !== this.filters.category) return false;
            
            // Recurring filter
            if (this.filters.recurring) {
                const isDaily = task.tags && task.tags.includes('daily');
                if (this.filters.recurring === 'daily' && !isDaily) return false;
                if (this.filters.recurring === 'non-daily' && isDaily) return false;
            }
            
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                return task.title.toLowerCase().includes(search) ||
                       (task.description && task.description.toLowerCase().includes(search));
            }
            return true;
        });
    }

    render() {
        if (this.currentView === 'board') {
            this.renderBoardView();
        } else if (this.currentView === 'list') {
            this.renderListView();
        } else if (this.currentView === 'calendar') {
            this.renderCalendarView();
        } else if (this.currentView === 'graph') {
            this.renderGraphView();
        } else if (this.currentView === 'analytics') {
            this.renderAnalyticsView();
        }

        this.updateCategoryCounts();
    }

    renderBoardView() {
        const statuses = ['backlog', 'todo', 'in-progress', 'done'];
        const tasks = this.getFilteredTasks();

        statuses.forEach(status => {
            const container = document.getElementById(`${status}-tasks`);
            const statusTasks = tasks.filter(t => t.status === status);
            
            container.innerHTML = statusTasks.map(task => this.renderTaskCard(task)).join('');
            
            // Update column count
            const column = container.closest('.kanban-column');
            column.querySelector('.column-count').textContent = statusTasks.length;
        });

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    renderTaskCard(task) {
        const priorityEmojis = {
            urgent: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
        };

        const isDaily = task.tags && task.tags.includes('daily');
        const dailyIndicator = isDaily ? '<span class="daily-badge" title="Daily recurring task">🔄</span>' : '';

        const checkbox = this.bulkSelectMode ? 
            `<input type="checkbox" ${this.selectedTasks.has(task.id) ? 'checked' : ''} 
                    onchange="app.toggleTaskSelection('${task.id}')" 
                    onclick="event.stopPropagation()">` : '';

        return `
            <div class="task-card ${isDaily ? 'daily-task' : ''}" data-task-id="${task.id}" draggable="true" 
                 ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)"
                 onclick="app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                ${checkbox}
                <div class="task-header-row">
                    <div class="task-priority">${priorityEmojis[task.priority]}</div>
                    ${dailyIndicator}
                </div>
                <h4>${task.title}</h4>
                ${task.description ? `<p>${task.description.substring(0, 100)}...</p>` : ''}
                ${task.tags && task.tags.length ? `
                    <div class="task-tags">
                        ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderListView() {
        const tasks = this.getFilteredTasks();
        const tbody = document.getElementById('listViewBody');
        
        tbody.innerHTML = tasks.map(task => {
            const isDaily = task.tags && task.tags.includes('daily');
            const dailyIcon = isDaily ? '🔄 ' : '';
            
            return `
            <tr onclick="app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                <td>
                    ${this.bulkSelectMode ? 
                        `<input type="checkbox" ${this.selectedTasks.has(task.id) ? 'checked' : ''} 
                                onchange="app.toggleTaskSelection('${task.id}')" 
                                onclick="event.stopPropagation()">` : ''}
                </td>
                <td>${dailyIcon}${task.title}</td>
                <td><span class="badge badge-${task.status}">${task.status}</span></td>
                <td><span class="badge badge-${task.priority}">${task.priority}</span></td>
                <td>${task.category}</td>
                <td>${task.dueDate || '-'}</td>
            </tr>
        `}).join('');
    }

    renderCalendarView() {
        const container = document.getElementById('calendarGrid');
        const monthTitle = document.getElementById('calendarMonth');
        
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        monthTitle.textContent = this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = '<div class="calendar-weekdays">';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="weekday">${day}</div>`;
        });
        html += '</div><div class="calendar-days">';
        
        // Empty cells before month starts
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = this.tasks.filter(t => t.dueDate === dateStr);
            
            const isToday = new Date().toDateString() === date.toDateString();
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    <div class="day-tasks">
                        ${dayTasks.slice(0, 3).map(t => `
                            <div class="mini-task ${t.status}" onclick="app.openTaskModal(app.tasks.find(task => task.id === '${t.id}'))">
                                ${t.title}
                            </div>
                        `).join('')}
                        ${dayTasks.length > 3 ? `<div class="more-tasks">+${dayTasks.length - 3} more</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    renderGraphView() {
        const canvas = document.getElementById('graphCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple dependency graph visualization
        const tasks = this.tasks.filter(t => t.dependencies && t.dependencies.length > 0);
        
        if (tasks.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('No task dependencies to visualize', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Draw nodes and connections
        const nodeRadius = 30;
        const nodes = {};
        let y = 50;
        
        this.tasks.forEach((task, i) => {
            const x = 100 + (i % 5) * 150;
            nodes[task.id] = { x, y: y + Math.floor(i / 5) * 100, task };
        });
        
        // Draw edges
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        tasks.forEach(task => {
            const from = nodes[task.id];
            task.dependencies.forEach(depId => {
                const to = nodes[depId];
                if (from && to) {
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();
                }
            });
        });
        
        // Draw nodes
        Object.values(nodes).forEach(({ x, y, task }) => {
            const colors = {
                backlog: '#6b7280',
                todo: '#3b82f6',
                'in-progress': '#f59e0b',
                done: '#10b981'
            };
            
            ctx.fillStyle = colors[task.status] || '#666';
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(task.title.substring(0, 10), x, y);
        });
    }

    renderAnalyticsView() {
        const container = document.getElementById('analyticsView');
        
        const stats = {
            total: this.tasks.length,
            byStatus: {},
            byPriority: {},
            byCategory: {},
            completed: this.tasks.filter(t => t.status === 'done').length,
            overdue: this.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
        };
        
        ['backlog', 'todo', 'in-progress', 'done'].forEach(status => {
            stats.byStatus[status] = this.tasks.filter(t => t.status === status).length;
        });
        
        ['urgent', 'high', 'medium', 'low'].forEach(priority => {
            stats.byPriority[priority] = this.tasks.filter(t => t.priority === priority).length;
        });
        
        ['project', 'automation', 'communication', 'maintenance'].forEach(category => {
            stats.byCategory[category] = this.tasks.filter(t => t.category === category).length;
        });
        
        container.innerHTML = `
            <div style="padding: 24px; max-width: 1200px; margin: 0 auto;">
                <h2 style="margin-bottom: 24px; color: var(--text-primary);">Task Analytics</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
                    <div class="stat-card">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Total Tasks</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.completed}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.byStatus['in-progress']}</div>
                        <div class="stat-label">In Progress</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.overdue}</div>
                        <div class="stat-label">Overdue</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                    <div class="chart-container">
                        <h3>By Status</h3>
                        ${Object.entries(stats.byStatus).map(([status, count]) => `
                            <div class="chart-bar">
                                <span class="chart-label">${status}</span>
                                <div class="chart-bar-fill" style="width: ${(count / stats.total * 100)}%; background: var(--${status}-color, #666)"></div>
                                <span class="chart-value">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="chart-container">
                        <h3>By Priority</h3>
                        ${Object.entries(stats.byPriority).map(([priority, count]) => `
                            <div class="chart-bar">
                                <span class="chart-label">${priority}</span>
                                <div class="chart-bar-fill" style="width: ${(count / stats.total * 100)}%; background: var(--priority-${priority}, #666)"></div>
                                <span class="chart-value">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="chart-container">
                        <h3>By Category</h3>
                        ${Object.entries(stats.byCategory).map(([category, count]) => `
                            <div class="chart-bar">
                                <span class="chart-label">${category}</span>
                                <div class="chart-bar-fill" style="width: ${(count / stats.total * 100)}%"></div>
                                <span class="chart-value">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    setupDragAndDrop() {
        document.querySelectorAll('.task-list').forEach(list => {
            list.ondragover = (e) => {
                e.preventDefault();
                e.currentTarget.classList.add('drag-over');
            };
            
            list.ondragleave = (e) => {
                e.currentTarget.classList.remove('drag-over');
            };
            
            list.ondrop = async (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = e.currentTarget.id.replace('-tasks', '');
                const task = this.tasks.find(t => t.id === taskId);
                
                if (task && task.status !== newStatus) {
                    try {
                        const response = await fetch(`/api/tasks/${taskId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...task, status: newStatus })
                        });
                        
                        if (!response.ok) throw new Error('Failed to update');
                        
                        await this.loadTasks();
                        this.render();
                        this.showToast('Task moved', 'success');
                    } catch (error) {
                        console.error('Error moving task:', error);
                        this.showToast('Failed to move task', 'error');
                    }
                }
            };
        });
    }

    toggleTaskSelection(taskId) {
        if (this.selectedTasks.has(taskId)) {
            this.selectedTasks.delete(taskId);
        } else {
            this.selectedTasks.add(taskId);
        }
        this.updateBulkUI();
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

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    exportTasks(format = 'json') {
        const data = format === 'json' ? 
            JSON.stringify(this.tasks, null, 2) :
            this.tasks.map(t => `${t.title}\t${t.status}\t${t.priority}`).join('\n');
        
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Drag handlers (called from inline events)
function handleDragStart(event) {
    const taskId = event.target.dataset.taskId;
    event.dataTransfer.setData('text/plain', taskId);
    event.target.classList.add('dragging');
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
}

// Initialize app
const app = new TaskManager();
window.app = app;
