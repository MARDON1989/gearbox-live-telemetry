// MTEL Historical Telemetry Viewer
let sessions = [];
let currentSession = null;
let currentLaps = [];

// Load sessions on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    setupFilters();
});

// Setup filter event listeners
function setupFilters() {
    const filters = ['filterDriver', 'filterTrack', 'filterCar', 'filterStartDate', 'filterEndDate'];
    filters.forEach(id => {
        document.getElementById(id).addEventListener('input', loadSessions);
    });
}

// Load sessions from API
async function loadSessions() {
    try {
        const params = new URLSearchParams();

        const driver = document.getElementById('filterDriver').value;
        const track = document.getElementById('filterTrack').value;
        const car = document.getElementById('filterCar').value;
        const startDate = document.getElementById('filterStartDate').value;
        const endDate = document.getElementById('filterEndDate').value;

        if (driver) params.append('driver', driver);
        if (track) params.append('track', track);
        if (car) params.append('car', car);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`/api/sessions?${params}`);
        sessions = await response.json();

        renderSessionList();
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

// Render session list
async function renderSessionList() {
    const container = document.getElementById('sessionListContainer');

    if (sessions.length === 0) {
        container.innerHTML = '<div class="no-data">No sessions found</div>';
        return;
    }

    // Fetch lap counts for all sessions
    const sessionsWithLaps = await Promise.all(sessions.map(async (session) => {
        try {
            const response = await fetch(`/api/sessions/${session.id}/laps`);
            const laps = await response.json();
            return { ...session, lapCount: laps.length };
        } catch (error) {
            console.error(`Error loading laps for session ${session.id}:`, error);
            return { ...session, lapCount: 0 };
        }
    }));

    container.innerHTML = sessionsWithLaps.map(session => `
        <div class="session-item ${currentSession?.id === session.id ? 'active' : ''}" 
             onclick="loadSession(${session.id})">
            <div class="session-date">${formatDate(session.started_at)}</div>
            <div class="session-track">${session.track_name}</div>
            <div class="session-car">${session.car_name}</div>
            <div class="session-stats">
                <span>🏁 ${session.lapCount} laps</span>
                ${session.best_lap_time ? `<span>⏱️ ${formatLapTime(session.best_lap_time)}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Load session details
async function loadSession(sessionId) {
    try {
        // Load session info
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`);
        currentSession = await sessionResponse.json();

        // Load laps
        const lapsResponse = await fetch(`/api/sessions/${sessionId}/laps`);
        currentLaps = await lapsResponse.json();

        renderSessionDetail();
        renderSessionList(); // Re-render to update active state
    } catch (error) {
        console.error('Error loading session:', error);
    }
}

// Render session detail
function renderSessionDetail() {
    const container = document.getElementById('sessionDetailContainer');
    container.className = ''; // Remove no-selection class

    if (!currentSession) {
        container.className = 'no-selection';
        container.innerHTML = 'Select a session to view details';
        return;
    }

    // Find best lap
    const bestLap = currentLaps.reduce((best, lap) => {
        if (!lap.is_valid) return best;
        if (!best || lap.lap_time < best.lap_time) return lap;
        return best;
    }, null);

    container.innerHTML = `
        <div class="detail-header">
            <div>
                <h2>${currentSession.driver_name} - ${currentSession.track_name}</h2>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                    ${currentSession.car_name} • ${formatDate(currentSession.started_at)}
                </p>
            </div>
            <button class="export-btn" onclick="exportToCSV()">📥 Export CSV</button>
        </div>

        <div class="metrics-grid">
            <div class="metric">
                <span class="metric-label">Total Laps</span>
                <span class="metric-value">${currentLaps.length}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Best Lap</span>
                <span class="metric-value success">${bestLap ? formatLapTime(bestLap.lap_time) : '--'}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Session Type</span>
                <span class="metric-value">${currentSession.session_type || 'Practice'}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Duration</span>
                <span class="metric-value">${calculateDuration()}</span>
            </div>
        </div>

        <div style="clear: both;"></div>

        <h3 style="margin: 2rem 0 1rem 0;">Lap Analysis</h3>
        <table class="lap-table">
            <thead>
                <tr>
                    <th>Lap</th>
                    <th>Time</th>
                    <th>S1</th>
                    <th>S2</th>
                    <th>S3</th>
                    <th>Fuel Used</th>
                    <th>Position</th>
                </tr>
            </thead>
            <tbody>
                ${currentLaps.map(lap => `
                    <tr class="${lap.id === bestLap?.id ? 'best-lap' : ''} ${!lap.is_valid ? 'invalid-lap' : ''}">
                        <td>${lap.lap_number}</td>
                        <td>${formatLapTime(lap.lap_time)}</td>
                        <td>${lap.sector1_time ? formatLapTime(lap.sector1_time) : '--'}</td>
                        <td>${lap.sector2_time ? formatLapTime(lap.sector2_time) : '--'}</td>
                        <td>${lap.sector3_time ? formatLapTime(lap.sector3_time) : '--'}</td>
                        <td>${lap.fuel_used ? lap.fuel_used.toFixed(3) + 'L' : '--'}</td>
                        <td>${lap.position || '--'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="chart-container">
            <h3>Lap Time Progression</h3>
            <canvas id="lapChart" width="800" height="300"></canvas>
        </div>
    `;

    // Draw simple lap time chart
    setTimeout(() => drawLapChart(), 100);
}

// Draw lap time chart (simple canvas implementation)
function drawLapChart() {
    const canvas = document.getElementById('lapChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get valid laps
    const validLaps = currentLaps.filter(l => l.is_valid && l.lap_time > 0);
    if (validLaps.length === 0) return;

    // Find min/max lap times
    const times = validLaps.map(l => l.lap_time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime;

    // Draw axes
    ctx.strokeStyle = '#6b6b7b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw lap time line
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();

    validLaps.forEach((lap, index) => {
        const x = padding + (index / (validLaps.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((lap.lap_time - minTime) / (timeRange || 1)) * (height - 2 * padding);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        // Draw point
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(x - 2, y - 2, 4, 4);
    });

    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '12px Inter';
    ctx.fillText(`Best: ${formatLapTime(minTime)}`, padding, padding - 10);
    ctx.fillText(`Worst: ${formatLapTime(maxTime)}`, padding, height - padding + 20);
}

// Export to CSV
function exportToCSV() {
    if (!currentSession || currentLaps.length === 0) return;

    const headers = ['Lap', 'Time', 'Sector 1', 'Sector 2', 'Sector 3', 'Fuel Used', 'Position', 'Valid'];
    const rows = currentLaps.map(lap => [
        lap.lap_number,
        lap.lap_time,
        lap.sector1_time || '',
        lap.sector2_time || '',
        lap.sector3_time || '',
        lap.fuel_used || '',
        lap.position || '',
        lap.is_valid ? 'Yes' : 'No'
    ]);

    const csv = [
        `Session: ${currentSession.driver_name} - ${currentSession.track_name}`,
        `Car: ${currentSession.car_name}`,
        `Date: ${formatDate(currentSession.started_at)}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MTEL_${currentSession.driver_name}_${currentSession.track_name}_${currentSession.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatLapTime(seconds) {
    if (!seconds || seconds <= 0) return '--:--.---';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
}

function calculateDuration() {
    if (!currentSession.started_at || !currentSession.ended_at) return '--';
    const start = new Date(currentSession.started_at);
    const end = new Date(currentSession.ended_at);
    const duration = (end - start) / 1000 / 60; // minutes
    return `${Math.floor(duration)} min`;
}
