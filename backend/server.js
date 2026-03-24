const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// helper to run the C executable and get JSON output
function runCBackend(args) {
    return new Promise((resolve, reject) => {
        const child = spawn('./dijkstra.exe', args);
        let data = '';
        child.stdout.on('data', (chunk) => data += chunk);
        child.on('close', () => {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
}

// api to find shortest path between two points
app.post('/api/shortest-path', async (req, res) => {
    try {
        const result = await runCBackend(['path', req.body.startId, req.body.endId]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'failed to run pathfinder' });
    }
});

// api to find the nearest facility of a certain type
app.post('/api/find-facility', async (req, res) => {
    try {
        const result = await runCBackend(['facility', req.body.startId, req.body.facilityType]);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'failed to find facility' });
    }
});

app.listen(3001, () => console.log('Server started on port 3001'));
