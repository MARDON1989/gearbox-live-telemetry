/**
 * MTEL - Mardon Telemetry Enhanced Server
 * Central server with database integration for historical data storage
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const TelemetryDatabase = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Determine database path
let DB_PATH = process.env.DATABASE_PATH;
if (!DB_PATH) {
    if (process.platform === 'win32') {
        // On Windows, store in %APPDATA%/MTEL/telemetry.db
        const appData = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
        const dataDir = path.join(appData, 'MTEL');

        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        DB_PATH = path.join(dataDir, 'telemetry.db');
    } else {
        // Default relative path for dev/linux
        DB_PATH = path.join(__dirname, 'telemetry.db');
    }
}

// Initialize database
const db = new TelemetryDatabase(DB_PATH);
console.log(`Database initialized at ${DB_PATH}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Store connected agents and their active sessions
const connectedAgents = new Map();
const activeSessions = new Map(); // agentId -> sessionId

// REST API endpoints for historical data
app.get('/api/sessions', (req, res) => {
    try {
        const filters = {
            driverName: req.query.driver,
            trackName: req.query.track,
            carName: req.query.car,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: req.query.limit ? parseInt(req.query.limit) : null
        };
        const sessions = db.getAllSessions(filters);
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

app.get('/api/sessions/:id', (req, res) => {
    try {
        const session = db.getSession(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

app.get('/api/sessions/:id/laps', (req, res) => {
    try {
        const laps = db.getSessionLaps(req.params.id);
        res.json(laps);
    } catch (error) {
        console.error('Error fetching laps:', error);
        res.status(500).json({ error: 'Failed to fetch laps' });
    }
});

app.get('/api/sessions/:id/telemetry', (req, res) => {
    try {
        const lapNumber = req.query.lap ? parseInt(req.query.lap) : null;
        const telemetry = db.getSessionTelemetry(req.params.id, lapNumber);
        res.json(telemetry);
    } catch (error) {
        console.error('Error fetching telemetry:', error);
        res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

// Button Box Layout Endpoints
app.post('/api/buttonbox/layout', (req, res) => {
    try {
        const { layoutName = 'default', buttons } = req.body;
        db.saveButtonLayout(layoutName, buttons);
        res.json({ success: true, message: 'Layout saved' });
    } catch (error) {
        console.error('Error saving layout:', error);
        res.status(500).json({ error: 'Failed to save layout' });
    }
});

app.get('/api/buttonbox/layout/:name?', (req, res) => {
    try {
        const layoutName = req.params.name || 'default';
        const layout = db.getButtonLayout(layoutName);
        res.json({ layout });
    } catch (error) {
        console.error('Error loading layout:', error);
        res.status(500).json({ error: 'Failed to load layout' });
    }
});

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
            lastUpdate: new Date(),
            currentTrack: null,
            currentCar: null,
            sessionId: null
        };
        connectedAgents.set(socket.id, agentInfo);
        console.log(`Agent registered: ${agentInfo.driverName} from ${agentInfo.computerName}`);

        // Broadcast updated agent list to all clients
        io.emit('agents-update', Array.from(connectedAgents.values()));
    });

    // Handle session start
    socket.on('session-start', (data) => {
        const agent = connectedAgents.get(socket.id);
        if (agent) {
            // Create new session in database
            const sessionId = db.createSession({
                driverName: agent.driverName,
                computerName: agent.computerName,
                trackName: data.trackName,
                trackConfig: data.trackConfig,
                carName: data.carName,
                carClass: data.carClass,
                sessionType: data.sessionType
            });

            agent.sessionId = sessionId;
            agent.currentTrack = data.trackName;
            agent.currentCar = data.carName;
            activeSessions.set(socket.id, sessionId);

            console.log(`Session started: ${agent.driverName} - ${data.trackName} in ${data.carName}`);

            io.emit('session-started', {
                agentId: socket.id,
                sessionId: sessionId,
                driverName: agent.driverName,
                ...data
            });
        }
    });

    // Handle telemetry data from agents
    socket.on('telemetry-data', (data) => {
        const agent = connectedAgents.get(socket.id);
        if (agent) {
            agent.lastUpdate = new Date();

            // Store lap data if completed
            if (data.lapCompleted && agent.sessionId) {
                const lapId = db.addLap({
                    sessionId: agent.sessionId,
                    lapNumber: data.lapNumber,
                    lapTime: data.lapTime,
                    sector1Time: data.sector1Time,
                    sector2Time: data.sector2Time,
                    sector3Time: data.sector3Time,
                    isValid: data.isValid,
                    fuelLevel: data.fuelLevel,
                    fuelUsed: data.fuelUsed,
                    position: data.position,
                    classPosition: data.classPosition,
                    gapToLeader: data.gapToLeader,
                    gapToAhead: data.gapToAhead,
                    gapToBehind: data.gapToBehind
                });

                console.log(`Lap recorded: ${agent.driverName} - Lap ${data.lapNumber}: ${data.lapTime}s`);

                // Update fuel analysis if fuel data available
                if (data.fuelAnalysis) {
                    db.updateFuelAnalysis(agent.sessionId, data.fuelAnalysis);
                }

                // Broadcast lap completion
                io.emit('lap-completed', {
                    agentId: socket.id,
                    driverName: agent.driverName,
                    lapId: lapId,
                    sessionId: agent.sessionId,
                    ...data
                });
            }

            // Store telemetry snapshot periodically
            if (data.snapshot && agent.sessionId) {
                db.addTelemetrySnapshot({
                    sessionId: agent.sessionId,
                    lapNumber: data.lapNumber,
                    speed: data.speed,
                    rpm: data.rpm,
                    gear: data.gear,
                    throttle: data.throttle,
                    brake: data.brake,
                    fuelLevel: data.fuelLevel,
                    lapDistPct: data.lapDistPct
                });
            }

            // Broadcast live telemetry to all connected frontends
            io.emit('telemetry-update', data);
        }
    });

    // Handle button box commands
    socket.on('button-command', (data) => {
        console.log('Button command:', data);

        // Broadcast to all connected agents
        io.emit('execute-command', {
            button: data.button,
            action: data.action,
            timestamp: Date.now()
        });
    });

    // Handle pit-stop events from agents
    socket.on('pit-stop', (data) => {
        const agent = connectedAgents.get(socket.id);
        if (agent) {
            console.log(`Pit stop: Car ${data.carIdx} - Lap ${data.lapNumber} - Duration: ${data.duration.toFixed(2)}s`);

            // Broadcast pit stop to all frontends
            io.emit('pit-stop', {
                agentId: socket.id,
                sessionId: agent.sessionId,
                ...data
            });
        }
    });

    // Handle lap-completed events from agent
    socket.on('lap-completed', (data) => {
        const agent = connectedAgents.get(socket.id);
        if (agent) {
            console.log(`Lap completed from ${agent.driverName}: Lap ${data.lapNumber}, Time: ${data.lapTime}s, Fuel used: ${data.fuelUsed}L`);

            // Store lap data if we have a session
            if (agent.sessionId) {
                const lapId = db.addLap({
                    sessionId: agent.sessionId,
                    lapNumber: data.lapNumber,
                    lapTime: data.lapTime,
                    sector1Time: data.sector1Time || null,
                    sector2Time: data.sector2Time || null,
                    sector3Time: data.sector3Time || null,
                    isValid: data.isValid,
                    fuelLevel: data.fuelLevel || 0,
                    fuelUsed: data.fuelUsed || 0,
                    position: data.position || 0,
                    classPosition: data.classPosition || 0,
                    gapToLeader: data.gapToLeader || 0,
                    gapToAhead: data.gapToAhead || 0,
                    gapToBehind: data.gapToBehind || 0
                });

                // Update fuel analysis if available
                if (data.fuelAnalysis) {
                    db.updateFuelAnalysis(agent.sessionId, data.fuelAnalysis);
                }

                // Broadcast lap completion to all clients
                io.emit('lap-completed', {
                    agentId: socket.id,
                    driverName: agent.driverName,
                    lapId: lapId,
                    sessionId: agent.sessionId,
                    ...data
                });
            }
        }
    });

    // Handle session end from agents
    socket.on('session-end', (data) => {
        const agent = connectedAgents.get(socket.id);
        if (agent && agent.sessionId) {
            console.log(`Session ended: ${agent.driverName} - ${data.totalLaps} laps, Best: ${data.bestLapTime}s`);

            // Update session with final stats
            db.updateSession(agent.sessionId, {
                totalLaps: data.totalLaps || 0,
                bestLapTime: data.bestLapTime || null
            });

            io.emit('session-ended', {
                agentId: socket.id,
                sessionId: agent.sessionId,
                driverName: agent.driverName,
                totalLaps: data.totalLaps,
                bestLapTime: data.bestLapTime
            });

            // Clear session from agent
            agent.sessionId = null;
            activeSessions.delete(socket.id);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const agent = connectedAgents.get(socket.id);
        if (agent) {
            // End active session if exists
            if (agent.sessionId) {
                const sessionLaps = db.getSessionLaps(agent.sessionId);
                const bestLap = db.getBestLap(agent.sessionId);
                db.updateSession(agent.sessionId, {
                    totalLaps: sessionLaps.length,
                    bestLapTime: bestLap ? bestLap.lap_time : null
                });
            }

            console.log(`Agent disconnected: ${agent.driverName}`);
            connectedAgents.delete(socket.id);
            activeSessions.delete(socket.id);
            io.emit('agents-update', Array.from(connectedAgents.values()));
        } else {
            console.log(`Client disconnected: ${socket.id}`);
        }
    });

    // Send current state to newly connected GUI clients
    socket.emit('initial-data', {
        agents: Array.from(connectedAgents.values()),
        recentSessions: db.getRecentSessions(5)
    });
});

// REST API endpoints

// Sessions
app.get('/api/sessions', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(db.getRecentSessions(limit));
});

app.get('/api/sessions/:id', (req, res) => {
    const session = db.getSession(req.params.id);
    if (session) {
        res.json(session);
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

app.get('/api/sessions/:id/laps', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const laps = db.getSessionLaps(req.params.id, limit);
    res.json(laps);
});

app.get('/api/sessions/:id/best-lap', (req, res) => {
    const bestLap = db.getBestLap(req.params.id);
    if (bestLap) {
        res.json(bestLap);
    } else {
        res.status(404).json({ error: 'No valid laps found' });
    }
});

// Fuel analysis
app.get('/api/sessions/:id/fuel', (req, res) => {
    const fuelAnalysis = db.getFuelAnalysis(req.params.id);
    if (fuelAnalysis) {
        res.json(fuelAnalysis);
    } else {
        res.status(404).json({ error: 'No fuel data available' });
    }
});

// Driver statistics
app.get('/api/drivers/:name/stats', (req, res) => {
    const stats = db.getDriverStats(req.params.name);
    res.json(stats);
});

// Active agents
app.get('/api/agents', (req, res) => {
    res.json(Array.from(connectedAgents.values()));
});

// Overall statistics
app.get('/api/stats', (req, res) => {
    const sessions = db.getRecentSessions(1000);
    const stats = {
        totalSessions: sessions.length,
        activeAgents: connectedAgents.size,
        drivers: [...new Set(sessions.map(s => s.driver_name))],
        tracks: [...new Set(sessions.map(s => s.track_name))],
        cars: [...new Set(sessions.map(s => s.car_name))]
    };
    res.json(stats);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        activeAgents: connectedAgents.size,
        activeSessions: activeSessions.size,
        database: 'connected'
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Helper function to get local IP address
function getLocalIPAddress() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip internal and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Start server on all network interfaces for tablet/phone access
server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIPAddress();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`MTEL Server running on port ${PORT}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Local Access:   http://localhost:${PORT}`);
    console.log(`Network Access: http://${localIP}:${PORT}`);
    console.log(`\nFor Button Box on tablet/phone, use:`);
    console.log(`http://${localIP}:${PORT}/buttonbox.html`);
    console.log(`${'='.repeat(60)}\n`);
});
