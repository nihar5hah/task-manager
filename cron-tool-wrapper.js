
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function list() {
    try {
        // Try using openclaw CLI directly
        const { stdout } = await execAsync('openclaw cron list --json');
        return JSON.parse(stdout);
    } catch (error) {
        console.error('Failed to call openclaw CLI:', error.message);
        return { jobs: [] };
    }
}

module.exports = { list };
