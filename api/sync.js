// This file is a placeholder for Vercel deployment
// The actual sync happens via the sync button calling the OpenClaw gateway API
// We can't use exec on Vercel serverless, so this just returns instructions

module.exports = async (req, res) => {
    res.status(200).json({
        message: 'Sync endpoint placeholder',
        note: 'For Vercel deployment, sync must be triggered from the local server or via direct API calls',
        instructions: 'Use the local development server (npm start) for full sync functionality'
    });
};
