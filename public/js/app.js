// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.filters = {
            status: '',
            priority: '',
            category: '',
            search: ''
        };
        this.currentView = 'board';
        this.bulkSelectMode = false;
        this.selectedTasks = new Set();
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
            });
        });

        // Category Filters
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filters.category = category;
                this.render();
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

        // Modal backdrop click
        document.querySelector('#taskModal .modal-backdrop').addEventListener('click', () => {
            this.closeTaskModal();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modal
            if (e.key === 'Escape') {
                const modal = document.getElementById('taskModal');
                if (modal.classList.contains('active')) {
                    this.closeTaskModal();
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
            const response = await fetch('/api/sync', {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to sync tasks');

            await this.loadTasks();
            this.render();
            this.showToast('Tasks synced', 'success');
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

        const checkbox = this.bulkSelectMode ? 
            `<input type="checkbox" ${this.selectedTasks.has(task.id) ? 'checked' : ''} 
                    onchange="app.toggleTaskSelection('${task.id}')" 
                    onclick="event.stopPropagation()">` : '';

        return `
            <div class="task-card" data-task-id="${task.id}" draggable="true" 
                 ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)"
                 onclick="app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                ${checkbox}
                <div class="task-priority">${priorityEmojis[task.priority]}</div>
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
        
        tbody.innerHTML = tasks.map(task => `
            <tr onclick="app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                <td>
                    ${this.bulkSelectMode ? 
                        `<input type="checkbox" ${this.selectedTasks.has(task.id) ? 'checked' : ''} 
                                onchange="app.toggleTaskSelection('${task.id}')" 
                                onclick="event.stopPropagation()">` : ''}
                </td>
                <td>${task.title}</td>
                <td><span class="badge badge-${task.status}">${task.status}</span></td>
                <td><span class="badge badge-${task.priority}">${task.priority}</span></td>
                <td>${task.category}</td>
                <td>${task.dueDate || '-'}</td>
            </tr>
        `).join('');
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
