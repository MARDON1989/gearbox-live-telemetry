const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Store connected agents and their data
const connectedAgents = new Map();
const lapData = [];

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle agent registration
    socket.on('register-agent', (data) => {
        const agentInfo = {
            id: socket.id,
            driverName: data.driverName || 'Unknown',
            computerName: data.computerName || 'Unknown',
            connectedAt: new Date(),
            lastUpdate: new Date()
        };
        connectedAgents.set(socket.id, agentInfo);
        console.log(`Agent registered: ${agentInfo.driverName} from ${agentInfo.computerName}`);

        // Broadcast updated agent list to all clients
        io.emit('agents-update', Array.from(connectedAgents.values()));
    });

    // Handle telemetry data from agents
    socket.on('telemetry-data', (data) => {
        const agent = connectedAgents.get(socket.id);
        if (agent) {
            agent.lastUpdate = new Date();

            // Process lap time data
            if (data.lapTime) {
                const lapEntry = {
                    driverName: agent.driverName,
                    computerName: agent.computerName,
                    lapTime: data.lapTime,
                    lapNumber: data.lapNumber || 0,
                    trackName: data.trackName || 'Unknown',
                    carName: data.carName || 'Unknown',
                    timestamp: new Date(),
                    isValid: data.isValid !== false
                };

                lapData.push(lapEntry);
                console.log(`Lap recorded: ${agent.driverName} - ${data.lapTime}s`);

                // Broadcast to all GUI clients
                io.emit('new-lap', lapEntry);
            }

            // Broadcast live telemetry to GUI clients
            io.emit('live-telemetry', {
                agentId: socket.id,
                driverName: agent.driverName,
                ...data
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const agent = connectedAgents.get(socket.id);
        if (agent) {
            console.log(`Agent disconnected: ${agent.driverName}`);
            connectedAgents.delete(socket.id);
            io.emit('agents-update', Array.from(connectedAgents.values()));
        } else {
            console.log(`Client disconnected: ${socket.id}`);
        }
    });

    // Send current state to newly connected GUI clients
    socket.emit('initial-data', {
        agents: Array.from(connectedAgents.values()),
        recentLaps: lapData.slice(-50) // Last 50 laps
    });
});

// REST API endpoints
app.get('/api/laps', (req, res) => {
    res.json(lapData);
});

app.get('/api/laps/recent/:count', (req, res) => {
    const count = parseInt(req.params.count) || 10;
    res.json(lapData.slice(-count));
});

app.get('/api/agents', (req, res) => {
    res.json(Array.from(connectedAgents.values()));
});

app.get('/api/stats', (req, res) => {
    const stats = {
        totalLaps: lapData.length,
        activeAgents: connectedAgents.size,
        drivers: [...new Set(lapData.map(lap => lap.driverName))],
        tracks: [...new Set(lapData.map(lap => lap.trackName))]
    };
    res.json(stats);
});

// Start server
server.listen(PORT, () => {
    console.log(`iRacing Telemetry Server running on port ${PORT}`);
    console.log(`GUI available at http://localhost:${PORT}`);
});
