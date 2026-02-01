const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => {
    res.send('Task Manager API is running!');
});

app.get('/tasks', (req, res) => {
    const filePath = path.join(__dirname, 'cron-tasks.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send({ error: 'Failed to load tasks.' });
        } else {
            res.send(JSON.parse(data));
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});