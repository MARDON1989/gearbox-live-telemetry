// Connect to Socket.IO server
// Use the same origin as the page (works whether local or remote)
const socket = io(window.location.origin);

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const lapTimesContainer = document.getElementById('lapTimesContainer');
const bestLapContainer = document.getElementById('bestLap');
const driversListContainer = document.getElementById('driversList');

// State
let laps = [];
let bestLap = null;
let connectedAgents = [];

// Connection status
socket.on('connect', () => {
    console.log('Connected to server');
    statusIndicator.classList.add('connected');
    statusText.textContent = 'Connected';
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    statusIndicator.classList.remove('connected');
    statusText.textContent = 'Disconnected';
});

// Initial data load
socket.on('initial-data', (data) => {
    console.log('Received initial data:', data);
    connectedAgents = data.agents || [];
    laps = data.recentLaps || [];

    updateDriversList();
    updateLapTimes();
    updateBestLap();
});

// New lap received
socket.on('new-lap', (lapData) => {
    console.log('New lap:', lapData);
    laps.unshift(lapData); // Add to beginning

    // Keep only last 20 laps
    if (laps.length > 20) {
        laps = laps.slice(0, 20);
    }

    updateLapTimes();
    updateBestLap();
});

// Agents update
socket.on('agents-update', (agents) => {
    console.log('Agents updated:', agents);
    connectedAgents = agents;
    updateDriversList();
});

// Update lap times display
function updateLapTimes() {
    if (laps.length === 0) {
        lapTimesContainer.innerHTML = '<div class="no-data">Waiting for telemetry data...</div>';
        return;
    }

    lapTimesContainer.innerHTML = laps.map(lap => `
        <div class="lap-entry ${lap.isValid ? '' : 'invalid'}">
            <div class="lap-info">
                <div class="driver-name">${escapeHtml(lap.driverName)}</div>
                <div class="lap-details">
                    Lap ${lap.lapNumber} • ${escapeHtml(lap.trackName)}
                    ${lap.isValid ? '' : ' • <span style="color: var(--accent-red)">INVALID</span>'}
                </div>
            </div>
            <div class="lap-time">${formatLapTime(lap.lapTime)}</div>
        </div>
    `).join('');
}

// Update best lap display
function updateBestLap() {
    const validLaps = laps.filter(lap => lap.isValid);

    if (validLaps.length === 0) {
        bestLapContainer.innerHTML = '<div class="no-data">No valid laps recorded yet</div>';
        return;
    }

    // Find fastest lap
    bestLap = validLaps.reduce((best, current) =>
        (!best || current.lapTime < best.lapTime) ? current : best
    );

    bestLapContainer.innerHTML = `
        <div class="driver-name">${escapeHtml(bestLap.driverName)}</div>
        <div class="lap-time">${formatLapTime(bestLap.lapTime)}</div>
        <div class="lap-details">
            ${escapeHtml(bestLap.trackName)} • ${escapeHtml(bestLap.carName)}
        </div>
    `;
}

// Update drivers list
function updateDriversList() {
    if (connectedAgents.length === 0) {
        driversListContainer.innerHTML = '<div class="no-data">No drivers connected</div>';
        return;
    }

    driversListContainer.innerHTML = connectedAgents.map(agent => `
        <div class="driver-entry">
            <div>
                <div class="driver-name">${escapeHtml(agent.driverName)}</div>
                <div class="computer-name">${escapeHtml(agent.computerName)}</div>
            </div>
            <div class="driver-status">LIVE</div>
        </div>
    `).join('');
}

// Utility functions
function formatLapTime(seconds) {
    if (!seconds || seconds <= 0) return '--:--.---';

    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Error handling
socket.on('error', (error) => {
    console.error('Socket error:', error);
});
