const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

module.exports = async (req, res) => {
    try {
        // Run the sync manager
        const syncManagerPath = path.join(__dirname, '..', 'sync-manager.js');
        const { stdout, stderr } = await execAsync(`node ${syncManagerPath}`);
        
        if (stderr) {
            console.error('Sync stderr:', stderr);
        }
        
        console.log('Sync output:', stdout);
        
        res.status(200).send({ 
            message: 'Tasks synchronized successfully.',
            output: stdout
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).send({ 
            error: 'Failed to sync tasks.',
            details: error.message
        });
    }
};