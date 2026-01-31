// Global State
const state = {
    tasks: [],
    config: {},
    filters: {
        search: '',
        category: '',
        priority: ''
    },
    darkMode: false
};

// API Base URL
const API_URL = '/api';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadConfig();
    loadTasks();
    setupEventListeners();
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        enableDarkMode();
    }
}

function enableDarkMode() {
    state.darkMode = true;
    document.body.classList.add('dark-mode');
    document.querySelector('.theme-icon').textContent = '☀️';
    localStorage.setItem('theme', 'dark');
}

function disableDarkMode() {
    state.darkMode = false;
    document.body.classList.remove('dark-mode');
    document.querySelector('.theme-icon').textContent = '🌙';
    localStorage.setItem('theme', 'light');
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        if (state.darkMode) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });

    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        openModal();
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadTasks();
        showToast('Tasks refreshed', 'success');
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') {
            closeModal();
        }
    });

    // Form submit
    document.getElementById('taskForm').addEventListener('submit', handleFormSubmit);

    // Delete button
    document.getElementById('deleteTaskBtn').addEventListener('click', handleDeleteTask);

    // Filters
    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        filterAndRenderTasks();
    });

    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        state.filters.category = e.target.value;
        filterAndRenderTasks();
    });

    document.getElementById('priorityFilter').addEventListener('change', (e) => {
        state.filters.priority = e.target.value;
        filterAndRenderTasks();
    });
}

// API Functions
async function loadConfig() {
    try {
        const response = await fetch(`${API_URL}/config`);
        state.config = await response.json();
    } catch (error) {
        console.error('Error loading config:', error);
        showToast('Failed to load configuration', 'error');
    }
}

async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        state.tasks = await response.json();
        filterAndRenderTasks();
        updateStats();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Failed to load tasks', 'error');
    }
}

async function createTask(taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        const newTask = await response.json();
        state.tasks.push(newTask);
        filterAndRenderTasks();
        updateStats();
        showToast('Task created successfully', 'success');
        return newTask;
    } catch (error) {
        console.error('Error creating task:', error);
        showToast('Failed to create task', 'error');
        throw error;
    }
}

async function updateTask(id, taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        const updatedTask = await response.json();
        const index = state.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            state.tasks[index] = updatedTask;
        }
        filterAndRenderTasks();
        updateStats();
        showToast('Task updated successfully', 'success');
        return updatedTask;
    } catch (error) {
        console.error('Error updating task:', error);
        showToast('Failed to update task', 'error');
        throw error;
    }
}

async function deleteTask(id) {
    try {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE'
        });
        state.tasks = state.tasks.filter(t => t.id !== id);
        filterAndRenderTasks();
        updateStats();
        showToast('Task deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
        throw error;
    }
}

async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();

        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('doneTasks').textContent = stats.byStatus.done;
        document.getElementById('todayTasks').textContent = stats.completedToday;

        // Update column counts
        document.querySelector('[data-count="backlog"]').textContent = stats.byStatus.backlog;
        document.querySelector('[data-count="todo"]').textContent = stats.byStatus.todo;
        document.querySelector('[data-count="in-progress"]').textContent = stats.byStatus.inProgress;
        document.querySelector('[data-count="done"]').textContent = stats.byStatus.done;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Filter and Render
function filterAndRenderTasks() {
    let filteredTasks = [...state.tasks];

    // Apply filters
    if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(search) ||
            task.description.toLowerCase().includes(search)
        );
    }

    if (state.filters.category) {
        filteredTasks = filteredTasks.filter(task => task.category === state.filters.category);
    }

    if (state.filters.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === state.filters.priority);
    }

    renderTasks(filteredTasks);
}

function renderTasks(tasks) {
    // Clear all columns
    ['backlog', 'todo', 'in-progress', 'done'].forEach(status => {
        const container = document.getElementById(`${status}-tasks`);
        container.innerHTML = '';
    });

    // Group tasks by status
    const tasksByStatus = {
        'backlog': [],
        'todo': [],
        'in-progress': [],
        'done': []
    };

    tasks.forEach(task => {
        tasksByStatus[task.status].push(task);
    });

    // Render tasks in each column
    Object.keys(tasksByStatus).forEach(status => {
        const container = document.getElementById(`${status}-tasks`);
        const statusTasks = tasksByStatus[status];

        if (statusTasks.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No tasks</div></div>';
        } else {
            statusTasks.forEach(task => {
                container.appendChild(createTaskCard(task));
            });
        }
    });
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.taskId = task.id;

    const categoryIcon = getCategoryIcon(task.category);
    const priorityClass = task.priority;

    card.innerHTML = `
        <div class="task-card-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <span class="task-priority ${priorityClass}">${task.priority}</span>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-footer">
            <span class="task-category">${categoryIcon} ${task.category}</span>
            <span class="task-source">${task.source}</span>
        </div>
    `;

    card.addEventListener('click', () => openModal(task));

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

// Modal Functions
function openModal(task = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const deleteBtn = document.getElementById('deleteTaskBtn');

    if (task) {
        // Edit mode
        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskSource').value = task.source;
        deleteBtn.style.display = 'block';
    } else {
        // Create mode
        document.getElementById('modalTitle').textContent = 'Add New Task';
        form.reset();
        document.getElementById('taskId').value = '';
        deleteBtn.style.display = 'none';
    }

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value,
        source: document.getElementById('taskSource').value
    };

    const taskId = document.getElementById('taskId').value;

    try {
        if (taskId) {
            await updateTask(taskId, taskData);
        } else {
            await createTask(taskData);
        }
        closeModal();
    } catch (error) {
        // Error handled in create/update functions
    }
}

async function handleDeleteTask() {
    const taskId = document.getElementById('taskId').value;
    if (!taskId) return;

    if (confirm('Are you sure you want to delete this task?')) {
        try {
            await deleteTask(taskId);
            closeModal();
        } catch (error) {
            // Error handled in deleteTask function
        }
    }
}

// Utility Functions
function getCategoryIcon(category) {
    const icons = {
        'automation': '🤖',
        'project': '🚀',
        'communication': '💬',
        'maintenance': '🔧'
    };
    return icons[category] || '📌';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export for use in kanban.js
window.app = {
    state,
    updateTask,
    loadTasks
};
