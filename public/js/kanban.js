// Drag and Drop Functionality for Kanban Board

let draggedTask = null;

// Setup drag and drop for all task lists
document.addEventListener('DOMContentLoaded', () => {
    setupDropZones();
});

function setupDropZones() {
    const taskLists = document.querySelectorAll('.task-list');

    taskLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('drop', handleDrop);
        list.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedTask = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');

    // Remove drag-over class from all lists
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';

    const taskList = e.currentTarget;
    taskList.classList.add('drag-over');

    return false;
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    e.preventDefault();

    const taskList = e.currentTarget;
    taskList.classList.remove('drag-over');

    if (draggedTask) {
        const taskId = draggedTask.dataset.taskId;
        const newStatus = taskList.closest('.kanban-column').dataset.status;

        // Find the task in state
        const task = window.app.state.tasks.find(t => t.id === taskId);

        if (task && task.status !== newStatus) {
            try {
                // Update task status
                await window.app.updateTask(taskId, { ...task, status: newStatus });
            } catch (error) {
                console.error('Error updating task status:', error);
            }
        }
    }

    return false;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('taskModal');
        if (modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    }

    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }

    // Ctrl/Cmd + N to add new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('addTaskBtn').click();
    }

    // Ctrl/Cmd + R to refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        document.getElementById('refreshBtn').click();
    }
});

// Export drag handlers for use in app.js
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
