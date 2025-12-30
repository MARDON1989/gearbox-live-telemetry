/**
 * MTEL - Mardon Telemetry Enhanced Frontend
 * Real-time telemetry dashboard with comprehensive data visualization
 */

// Connect to Socket.IO server - explicit URL for Electron compatibility
const socket = io('http://localhost:3000');

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const connectionStatus = document.getElementById('connectionStatus');

// Session Info
const sessionBadge = document.getElementById('sessionBadge');
const trackName = document.getElementById('trackName');
const carName = document.getElementById('carName');
const driverName = document.getElementById('driverName');

// Current Lap
const lapNumber = document.getElementById('lapNumber');
const currentLapTime = document.getElementById('currentLapTime');
const speed = document.getElementById('speed');
const gear = document.getElementById('gear');

// Best Lap
const bestLapTime = document.getElementById('bestLapTime');
const bestLapNumber = document.getElementById('bestLapNumber');

// Fuel Management
const fuelFill = document.getElementById('fuelFill');
const fuelPercentage = document.getElementById('fuelPercentage');
const fuelLevel = document.getElementById('fuelLevel');
const lapsRemaining = document.getElementById('lapsRemaining');
const avgFuelPerLap = document.getElementById('avgFuelPerLap');

// Race Position
const position = document.getElementById('position');
const classPosition = document.getElementById('classPosition');
const gapToLeader = document.getElementById('gapToLeader');

// Last 5 Laps
const last5LapsContainer = document.getElementById('last5Laps');

// Unit Toggle

// Unit Toggle
const unitToggleBtn = document.getElementById('unitToggleBtn');
const imperialLabel = document.getElementById('imperialLabel');
const metricLabel = document.getElementById('metricLabel');

// State
let currentSession = null;
let laps = [];
let bestLap = null;
let connectedAgents = [];
let currentTelemetry = {};

// Unit System State
let isImperial = UnitPreference.get(); // true = Imperial, false = Metric

// Drag and Resize State
let draggedElement = null;
let resizedElement = null;
let offsetX = 0;
let offsetY = 0;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

// Initialize drag and resize functionality
function initializeDragAndResize() {
    const draggableCards = document.querySelectorAll('.card.draggable');

    draggableCards.forEach(card => {
        const dragHandle = card.querySelector('.drag-handle');
        const resizeHandle = card.querySelector('.resize-handle');
        const cardId = card.getAttribute('data-card-id');

        // Load saved position and size
        loadCardState(card, cardId);

        // Drag functionality
        if (dragHandle) {
            // Add click handler to bring to front
            card.addEventListener('mousedown', () => {
                // Reset z-index of all floating cards
                document.querySelectorAll('.card.floating').forEach(c => {
                    c.style.zIndex = '100';
                });
                // Bring clicked card to front if it's floating
                if (card.classList.contains('floating')) {
                    card.style.zIndex = '101';
                }
            });

            dragHandle.addEventListener('mousedown', (e) => {
                if (e.target.closest('.resize-handle')) return;

                draggedElement = card;
                const rect = card.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;

                card.classList.add('dragging');
                card.style.position = 'fixed';
                card.style.left = rect.left + 'px';
                card.style.top = rect.top + 'px';
                card.style.width = rect.width + 'px';
                card.style.zIndex = '1000';

                e.preventDefault();
            });
        }

        // Resize functionality
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                resizedElement = card;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = card.offsetWidth;
                startHeight = card.offsetHeight;

                card.classList.add('resizing');
                e.preventDefault();
                e.stopPropagation();
            });
        }
    });

    // Global mouse move handler
    document.addEventListener('mousemove', (e) => {
        if (draggedElement) {
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            draggedElement.style.left = x + 'px';
            draggedElement.style.top = y + 'px';
        }

        if (resizedElement) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newWidth = Math.max(250, startWidth + deltaX);
            const newHeight = Math.max(150, startHeight + deltaY);

            resizedElement.style.width = newWidth + 'px';
            resizedElement.style.height = newHeight + 'px';
        }
    });

    // Global mouse up handler
    document.addEventListener('mouseup', () => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            const cardId = draggedElement.getAttribute('data-card-id');
            saveCardState(draggedElement, cardId);
            draggedElement = null;
        }

        if (resizedElement) {
            resizedElement.classList.remove('resizing');
            const cardId = resizedElement.getAttribute('data-card-id');
            saveCardState(resizedElement, cardId);
            resizedElement = null;
        }
    });
}

// Save card position and size to localStorage
function saveCardState(card, cardId) {
    if (!cardId) return;

    const state = {
        left: card.style.left,
        top: card.style.top,
        width: card.style.width,
        height: card.style.height,
        position: card.style.position
    };

    localStorage.setItem(`mtel-card-${cardId}`, JSON.stringify(state));
}

// Load card position and size from localStorage
function loadCardState(card, cardId) {
    if (!cardId) return;

    const savedState = localStorage.getItem(`mtel-card-${cardId}`);
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (state.position === 'fixed') {
                card.style.position = state.position;
                card.style.left = state.left;
                card.style.top = state.top;
                card.style.width = state.width;
                if (state.height) card.style.height = state.height;
                card.style.zIndex = '100';
            }
        } catch (e) {
            console.error('Error loading card state:', e);
        }
    }
}

// Reset all cards to default positions
function resetCardPositions() {
    const draggableCards = document.querySelectorAll('.card.draggable');
    draggableCards.forEach(card => {
        const cardId = card.getAttribute('data-card-id');
        card.style.position = '';
        card.style.left = '';
        card.style.top = '';
        card.style.width = '';
        card.style.height = '';
        card.style.zIndex = '';

        if (cardId) {
            localStorage.removeItem(`mtel-card-${cardId}`);
        }
    });
}

// Add reset button to header (optional - can be triggered via keyboard shortcut)
document.addEventListener('keydown', (e) => {
    // Keyboard shortcut: Ctrl+L to lock/unlock overlay
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        if (confirm('Reset all telemetry boxes to default positions?')) {
            resetCardPositions();
            location.reload();
        }
    }
});

// Unit Toggle Functionality
function initializeUnitToggle() {
    if (!unitToggleBtn) {
        console.warn('Unit toggle button not found');
        return;
    }

    // Set initial state
    updateUnitLabels();

    // Toggle button click handler
    unitToggleBtn.addEventListener('click', () => {
        isImperial = !isImperial;
        UnitPreference.set(isImperial);
        updateUnitLabels();

        // Re-render all telemetry with new units
        if (currentTelemetry && Object.keys(currentTelemetry).length > 0) {
            updateLiveTelemetry(currentTelemetry);
        }

        console.log(`Units switched to: ${isImperial ? 'Imperial' : 'Metric'}`);
    });
}

function updateUnitLabels() {
    if (isImperial) {
        imperialLabel.classList.add('active');
        metricLabel.classList.remove('active');
    } else {
        imperialLabel.classList.remove('active');
        metricLabel.classList.add('active');
    }
}

// Connection Events
socket.on('connect', () => {
    console.log('Connected to server');
    statusIndicator.classList.add('connected');
    connectionStatus.classList.add('connected');
    statusText.textContent = 'Connected';
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    statusIndicator.classList.remove('connected');
    connectionStatus.classList.remove('connected');
    statusText.textContent = 'Disconnected';
});

// Initial Data
socket.on('initial-data', (data) => {
    console.log('Received initial data:', data);
    connectedAgents = data.agents || [];
    // updateDriversList removed - no longer needed
});

// Session Events
socket.on('session-started', (data) => {
    console.log('Session started:', data);
    currentSession = data;
    sessionBadge.textContent = 'LIVE';
    sessionBadge.style.color = 'var(--accent-success)';
    trackName.textContent = data.trackName;
    carName.textContent = data.carName;
    driverName.textContent = data.driverName;

    // Reset lap data for new session
    laps = [];
    bestLap = null;
    // updateLapsList(); // Removed
});

socket.on('session-ended', (data) => {
    console.log('Session ended:', data);
    sessionBadge.textContent = 'Ended';
    sessionBadge.style.color = 'var(--text-muted)';
    currentSession = null;

    // Clear all telemetry data
    clearTelemetryData();
});

// Function to clear all telemetry data for new session
function clearTelemetryData() {
    console.log('Clearing all telemetry data for new session');

    // Reset state
    laps = [];
    bestLap = null;
    currentTelemetry = {};

    // Clear session info
    trackName.textContent = '--';
    carName.textContent = '--';
    driverName.textContent = '--';
    sessionBadge.textContent = 'Waiting...';
    sessionBadge.style.color = 'var(--text-muted)';

    // Clear current lap
    lapNumber.textContent = 'Lap --';
    currentLapTime.textContent = '--:--.---';
    speed.textContent = '0 mph';
    gear.textContent = 'N';

    // Clear best lap
    bestLapTime.textContent = '--:--.---';
    bestLapNumber.textContent = '--';

    // Clear fuel
    fuelFill.style.width = '0%';
    fuelPercentage.textContent = '0%';
    fuelLevel.textContent = '0.00 gal';
    lapsRemaining.textContent = '--';
    avgFuelPerLap.textContent = '--';

    // Clear position
    position.textContent = '--';
    classPosition.textContent = '--';
    gapToLeader.textContent = '--';

    const gapToAheadEl = document.getElementById('gapToAhead');
    const gapToBehindEl = document.getElementById('gapToBehind');
    if (gapToAheadEl) gapToAheadEl.textContent = '--';
    if (gapToBehindEl) gapToBehindEl.textContent = '--';

    // Clear last 5 laps
    last5LapsContainer.innerHTML = '<div class="no-data">No laps completed yet</div>';

    // Clear standings
    if (standingsBody) {
        standingsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No data</td></tr>';
    }

    // Clear tire monitor
    const tirePositions = ['LF', 'RF', 'LR', 'RR'];
    tirePositions.forEach(pos => {
        const pressureEl = document.getElementById(`tire${pos}Pressure`);
        const tempEl = document.getElementById(`tire${pos}Temp`);
        const wearEl = document.getElementById(`tire${pos}Wear`);

        if (pressureEl) pressureEl.textContent = '-- PSI';
        if (tempEl) tempEl.textContent = '--°F';
        if (wearEl) wearEl.style.width = '100%';
    });

    // Clear conditions
    const weatherTypeEl = document.getElementById('weatherType');
    const airTempEl = document.getElementById('airTemp');
    const trackTempEl = document.getElementById('trackTemp');
    const windSpeedEl = document.getElementById('windSpeed');

    if (weatherTypeEl) weatherTypeEl.textContent = '--';
    if (airTempEl) airTempEl.textContent = '--';
    if (trackTempEl) trackTempEl.textContent = '--';
    if (windSpeedEl) windSpeedEl.textContent = '--';
}

// Lap Completed
socket.on('lap-completed', (data) => {
    console.log('Lap completed:', data);
    console.log('Fuel used on this lap:', data.fuelUsed);

    laps.unshift({
        lapNumber: data.lapNumber,
        lapTime: data.lapTime,
        isValid: data.isValid,
        fuelUsed: data.fuelUsed,
        position: data.position
    });

    // Keep last 50 laps
    if (laps.length > 50) {
        laps = laps.slice(0, 50);
    }

    console.log('Total laps stored:', laps.length);
    console.log('Laps with fuel data:', laps.filter(l => l.fuelUsed && l.fuelUsed > 0).length);

    // updateLapsList(); // Removed
    updateBestLap();

    // Update fuel analysis if available
    if (data.fuelAnalysis) {
        updateFuelAnalysis(data.fuelAnalysis);
    }
});

// Live Telemetry Updates
socket.on('live-telemetry', (data) => {
    console.log('Received telemetry data:', data);
    currentTelemetry = data;
    updateLiveTelemetry(data);
});

// Agents Update
socket.on('agents-update', (agents) => {
    console.log('Agents updated:', agents);
    connectedAgents = agents;
});

// Pit Stop Events
let pitStopData = new Map(); // Store pit data by carIdx
socket.on('pit-stop', (data) => {
    console.log('Pit stop event:', data);
    pitStopData.set(data.carIdx, {
        carIdx: data.carIdx,
        lapNumber: data.lapNumber,
        duration: data.duration,
        timestamp: Date.now()
    });
    updatePitInfo();
});

// Update Functions

function updateLiveTelemetry(data) {
    try {
        // Session Info
        if (data.trackName) document.getElementById('trackName').textContent = data.trackName;
        if (data.carName) document.getElementById('carName').textContent = data.carName;
        if (data.driverName) document.getElementById('driverName').textContent = data.driverName;
        if (data.sessionLaps !== undefined && data.sessionLaps !== -1) {
            // If session is lap-limited
            document.getElementById('sessionBadge').textContent = `${data.sessionLaps} Laps Remaining`;
        } else if (data.sessionTime !== undefined) {
            // If session is time-limited (convert seconds to MM:SS)
            const minutes = Math.floor(data.sessionTime / 60);
            const seconds = Math.floor(data.sessionTime % 60);
            document.getElementById('sessionBadge').textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Current Lap (removed from Gearbox card, kept for compatibility)
        if (data.lapNumber !== undefined) {
            if (lapNumber) lapNumber.textContent = `Lap ${data.lapNumber}`;
        }

        if (data.currentLapTime !== undefined && data.currentLapTime > 0) {
            if (currentLapTime) currentLapTime.textContent = formatLapTime(data.currentLapTime);
        }

        if (data.speed !== undefined) {
            // iRacing provides speed in km/h, convert if Imperial
            const speedValue = isImperial ? UnitConverter.kphToMph(data.speed) : data.speed;
            speed.textContent = UnitConverter.formatSpeed(speedValue, isImperial);
        }

        if (data.gear !== undefined) {
            gear.textContent = data.gear === -1 ? 'R' : (data.gear === 0 ? 'N' : data.gear);
        }

        // RPM and LED Lights
        if (data.rpm !== undefined) {
            const rpmValue = document.getElementById('rpmValue');
            if (rpmValue) rpmValue.textContent = Math.round(data.rpm);

            // Update RPM LEDs
            updateRPMLEDs(data.rpm);
        }

        // Driving Controls
        if (data.throttle !== undefined) {
            const throttleBar = document.getElementById('throttleBar');
            const throttleValue = document.getElementById('throttleValue');
            const throttlePct = (data.throttle * 100).toFixed(0);
            if (throttleBar) throttleBar.style.width = `${throttlePct}%`;
            if (throttleValue) throttleValue.textContent = `${throttlePct}%`;
        }

        if (data.brake !== undefined) {
            const brakeBar = document.getElementById('brakeBar');
            const brakeValue = document.getElementById('brakeValue');
            const brakePct = (data.brake * 100).toFixed(0);
            if (brakeBar) brakeBar.style.width = `${brakePct}%`;
            if (brakeValue) brakeValue.textContent = `${brakePct}%`;
        }

        if (data.clutch !== undefined) {
            const clutchBar = document.getElementById('clutchBar');
            const clutchValue = document.getElementById('clutchValue');
            // Invert clutch: iRacing gives 1.0 when not pressed, 0.0 when fully pressed
            const clutchPct = ((1 - data.clutch) * 100).toFixed(0);
            if (clutchBar) clutchBar.style.width = `${clutchPct}%`;
            if (clutchValue) clutchValue.textContent = `${clutchPct}%`;
        }

        if (data.steeringAngle !== undefined) {
            const steeringPointer = document.getElementById('steeringPointer');
            const steeringValue = document.getElementById('steeringValue');
            // Convert radians to degrees
            const degrees = (data.steeringAngle * (180 / Math.PI)).toFixed(0);
            // Map steering angle to percentage (-540° to +540° typical range)
            // Invert the percentage so left turn = left movement
            const maxAngle = 540; // degrees
            const percentage = Math.max(-100, Math.min(100, (degrees / maxAngle) * 100));
            const leftPosition = 50 - percentage; // Inverted: negative degrees (left) = less than 50%

            if (steeringPointer) steeringPointer.style.left = `${leftPosition}%`;
            if (steeringValue) steeringValue.textContent = `${degrees}°`;
        }

        // Lap Times Card
        if (data.currentLapTime !== undefined) {
            const lapTimesCurrentLap = document.getElementById('lapTimesCurrentLap');
            if (lapTimesCurrentLap) lapTimesCurrentLap.textContent = formatLapTime(data.currentLapTime);
        }

        if (data.lastLapTime !== undefined && data.lastLapTime > 0) {
            const lapTimesLastLap = document.getElementById('lapTimesLastLap');
            if (lapTimesLastLap) lapTimesLastLap.textContent = formatLapTime(data.lastLapTime);
        }

        if (data.bestLapTime !== undefined && data.bestLapTime > 0) {
            const lapTimesBestLap = document.getElementById('lapTimesBestLap');
            if (lapTimesBestLap) lapTimesBestLap.textContent = formatLapTime(data.bestLapTime);
            // Also update old bestLapTime element if it exists for backwards compatibility
            if (bestLapTime) bestLapTime.textContent = formatLapTime(data.bestLapTime);
        }

        // Fuel
        if (data.fuelLevel !== undefined) {
            const fuelPct = (data.fuelLevelPct || 0) * 100;
            fuelFill.style.width = `${fuelPct}%`; // Changed from height to width
            fuelPercentage.textContent = `${Math.round(fuelPct)}%`;

            // iRacing provides fuel in liters, convert if Imperial
            const fuelValue = isImperial ? UnitConverter.litersToGallons(data.fuelLevel) : data.fuelLevel;
            fuelLevel.textContent = UnitConverter.formatFuel(fuelValue, isImperial);

            // Change color based on fuel level
            if (fuelPct < 20) {
                fuelFill.classList.add('low');
            } else {
                fuelFill.classList.remove('low');
            }

            // Calculate fuel analysis from live data if we have lap history
            if (laps.length > 0) {
                // Calculate average fuel per lap from completed laps
                const lapsWithFuel = laps.filter(lap => lap.fuelUsed && lap.fuelUsed > 0);
                console.log('Laps with fuel:', lapsWithFuel.length, 'Total laps:', laps.length);
                if (lapsWithFuel.length > 0) {
                    const totalFuel = lapsWithFuel.reduce((sum, lap) => sum + lap.fuelUsed, 0);
                    const avgFuelPerLapValue = totalFuel / lapsWithFuel.length;
                    const lapsRemainingValue = avgFuelPerLapValue > 0 ? data.fuelLevel / avgFuelPerLapValue : 0;

                    console.log('Fuel analysis:', { avgFuelPerLapValue, lapsRemainingValue, currentFuel: data.fuelLevel });

                    updateFuelAnalysis({
                        avgFuelPerLap: avgFuelPerLapValue,
                        lapsRemaining: lapsRemainingValue
                    });
                }
            }
        }

        // Position - show even if 0 (solo practice has position 0)
        if (data.position !== undefined) {
            console.log('Position data:', data.position, 'Class position:', data.classPosition);
            position.textContent = `P${data.position}`;
        }

        if (data.classPosition !== undefined) {
            classPosition.textContent = `P${data.classPosition}`;
            if (data.gapToLeader !== undefined) {
                gapToLeader.textContent = data.gapToLeader > 0 ? `+${data.gapToLeader.toFixed(3)}s` : '--';
            }

            if (data.gapToAhead !== undefined) {
                const el = document.getElementById('gapToAhead');
                if (el) el.textContent = data.gapToAhead > 0 ? `+${data.gapToAhead.toFixed(3)}s` : '--';
            }

            if (data.gapToBehind !== undefined) {
                const el = document.getElementById('gapToBehind');
                if (el) el.textContent = data.gapToBehind > 0 ? `+${data.gapToBehind.toFixed(3)}s` : '--';
            }
        }

        // Race Control
        if (data.lapNumber !== undefined) {
            const raceControlLap = document.getElementById('raceControlLap');
            if (raceControlLap) raceControlLap.textContent = data.lapNumber || '--';
        }

        if (data.sessionLaps !== undefined) {
            const lapsToGo = document.getElementById('lapsToGo');
            if (lapsToGo) {
                // sessionLaps is actually SessionLapsRemain from iRacing, so display it directly
                lapsToGo.textContent = Math.max(0, Math.floor(data.sessionLaps));
            }
        }

        // Flag Status
        if (data.sessionFlags !== undefined) {
            updateFlagStatus(data.sessionFlags);
        }

        // Last 5 Laps
        if (data.last5Laps && data.last5Laps.length > 0) {
            updateLast5Laps(data.last5Laps);
        }

        // Tire Monitor
        if (data.tires) {
            updateTireMonitor(data.tires);
        }

        // Standings - agent sends 'standings' not 'drivers'
        if (data.standings && data.standings.length > 0) {
            console.log('Updating standings with', data.standings.length, 'drivers');
            console.log('Running order available:', !!data.runningOrder);
            if (data.runningOrder) {
                console.log('Running order count:', data.runningOrder.length);
            }
            updateStandings(data.standings, data.runningOrder);
        }

        // Track Map
        if (data.runningOrder && data.runningOrder.length > 0) {
            updateTrackMap(data.runningOrder);
        }

        // Conditions (agent sends flat structure, not nested)
        if (data.airTemp !== undefined || data.trackTemp !== undefined) {
            try {
                updateConditions({
                    airTemp: data.airTemp,
                    trackTemp: data.trackTemp,
                    windSpeed: data.windSpeed,
                    windDir: data.windDir,
                    weatherType: data.weatherType,
                    skies: data.skies
                });
            } catch (e) {
                console.error('Error updating conditions:', e);
            }
        }
    } catch (err) {
        console.error('Error in updateLiveTelemetry:', err);
    }
}

function updateConditions(conditions) {
    const weatherTypeEl = document.getElementById('weatherType');
    const airTempEl = document.getElementById('airTemp');
    const trackTempEl = document.getElementById('trackTemp');
    const windSpeedEl = document.getElementById('windSpeed');
    const windDirArrow = document.getElementById('windDirArrow');

    if (weatherTypeEl) {
        const skies = ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast'];
        weatherTypeEl.textContent = skies[conditions.skies] || 'Unknown';
    }

    if (airTempEl) {
        const temp = isImperial ? UnitConverter.celsiusToFahrenheit(conditions.airTemp) : conditions.airTemp;
        airTempEl.textContent = UnitConverter.formatTemperature(temp, isImperial);
    }

    if (trackTempEl) {
        const temp = isImperial ? UnitConverter.celsiusToFahrenheit(conditions.trackTemp) : conditions.trackTemp;
        trackTempEl.textContent = UnitConverter.formatTemperature(temp, isImperial);
    }

    if (windSpeedEl) {
        // Wind speed is usually m/s in iRacing
        const speed = isImperial ? UnitConverter.kphToMph(conditions.windSpeed * 3.6) : (conditions.windSpeed * 3.6);
        windSpeedEl.textContent = UnitConverter.formatSpeed(speed, isImperial);
    }

    if (windDirArrow) {
        // Rotate arrow based on wind direction (radians)
        const degrees = (conditions.windDir * 180 / Math.PI);
        windDirArrow.style.transform = `rotate(${degrees}deg)`;
    }
}

function updateLast5Laps(lapTimes) {
    if (lapTimes.length === 0) {
        last5LapsContainer.innerHTML = '<div class="no-data">No laps completed yet</div>';
        return;
    }

    // Handle both old format (strings) and new format (objects) for backward compatibility
    last5LapsContainer.innerHTML = lapTimes.map((lapData, index) => {
        const lapNum = typeof lapData === 'object' ? lapData.lap : index + 1; // Fallback if index needed
        const timeStr = typeof lapData === 'object' ? lapData.time : lapData;

        return `
        <div class="flex" style="justify-content: space-between; padding: 0.5rem; background: var(--bg-glass); border-radius: 8px;">
            <span style="color: var(--text-muted); font-size: 0.875rem;">Lap ${lapNum}</span>
            <span style="font-family: var(--font-mono); font-weight: 600; color: var(--accent-primary);">${timeStr}</span>
        </div>
    `}).join('');
}

function updateFuelAnalysis(analysis) {
    if (analysis.avgFuelPerLap !== undefined) {
        // iRacing provides fuel in liters, convert if Imperial
        const avgFuel = isImperial ? UnitConverter.litersToGallons(analysis.avgFuelPerLap) : analysis.avgFuelPerLap;
        avgFuelPerLap.textContent = UnitConverter.formatFuel(avgFuel, isImperial);
    }

    if (analysis.lapsRemaining !== undefined) {
        const laps = Math.floor(analysis.lapsRemaining);
        lapsRemaining.textContent = laps;

        // Color code based on laps remaining
        if (laps < 3) {
            lapsRemaining.classList.add('danger');
            lapsRemaining.classList.remove('warning', 'success');
        } else if (laps < 5) {
            lapsRemaining.classList.add('warning');
            lapsRemaining.classList.remove('danger', 'success');
        } else {
            lapsRemaining.classList.add('success');
            lapsRemaining.classList.remove('danger', 'warning');
        }
    }
}

function updateBestLap() {
    const validLaps = laps.filter(lap => lap.isValid);

    if (validLaps.length === 0) {
        bestLapTime.textContent = '--:--.---';
        bestLapNumber.textContent = '--';
        return;
    }

    bestLap = validLaps.reduce((best, current) =>
        (!best || current.lapTime < best.lapTime) ? current : best
    );

    bestLapTime.textContent = formatLapTime(bestLap.lapTime);
    bestLapNumber.textContent = bestLap.lapNumber;
}

// Standings Logic
let showRelativeStandings = false;
const standingsBody = document.getElementById('standingsBody');
const standingsAllBtn = document.getElementById('standingsAllBtn');
const standingsRelBtn = document.getElementById('standingsRelBtn');

function initializeStandingsToggle() {
    if (standingsAllBtn && standingsRelBtn) {
        standingsAllBtn.addEventListener('click', () => {
            showRelativeStandings = false;
            standingsAllBtn.classList.add('active');
            standingsRelBtn.classList.remove('active');
            if (currentTelemetry.standings) updateStandings(currentTelemetry.standings, currentTelemetry.runningOrder);
        });

        standingsRelBtn.addEventListener('click', () => {
            showRelativeStandings = true;
            standingsRelBtn.classList.add('active');
            standingsAllBtn.classList.remove('active');
            if (currentTelemetry.standings) updateStandings(currentTelemetry.standings, currentTelemetry.runningOrder);
        });

        // Add keyboard shortcut (S key) to toggle standings - works even when locked
        document.addEventListener('keydown', (e) => {
            // Only trigger if not typing in an input/textarea
            if ((e.key === 's' || e.key === 'S') &&
                e.target.tagName !== 'INPUT' &&
                e.target.tagName !== 'TEXTAREA' &&
                !e.ctrlKey && !e.altKey && !e.metaKey) {

                e.preventDefault();
                console.log('Toggling standings view');

                // Toggle between All and Relative
                showRelativeStandings = !showRelativeStandings;

                if (showRelativeStandings) {
                    standingsRelBtn.classList.add('active');
                    standingsAllBtn.classList.remove('active');
                    console.log('Switched to Relative view');
                } else {
                    standingsAllBtn.classList.add('active');
                    standingsRelBtn.classList.remove('active');
                    console.log('Switched to All view');
                }

                if (currentTelemetry.standings) {
                    updateStandings(currentTelemetry.standings, currentTelemetry.runningOrder);
                }
            }
        });
    }
}

function updateStandings(drivers, runningOrder) {
    if (!drivers || !standingsBody) return;

    // Use running order for relative view, official standings for all view
    let sourceData = showRelativeStandings && runningOrder ? runningOrder : drivers;
    let displayDrivers = sourceData;

    if (showRelativeStandings) {
        // Find my index in running order
        const myIndex = sourceData.findIndex(d => d.isMe);
        if (myIndex !== -1) {
            // Show 2-3 ahead and 2-3 behind (total ~5-7 drivers)
            const ahead = 3;
            const behind = 3;
            const start = Math.max(0, myIndex - ahead);
            const end = Math.min(sourceData.length, myIndex + behind + 1);
            displayDrivers = sourceData.slice(start, end);
        }
    }

    standingsBody.innerHTML = displayDrivers.map(driver => {
        // Format lap times
        const lastLap = driver.lastLapTime > 0 ? formatLapTime(driver.lastLapTime) : '--:--.---';
        const bestLap = driver.bestLapTime > 0 ? formatLapTime(driver.bestLapTime) : '--:--.---';

        return `
        <tr class="${driver.isMe ? 'current' : ''}">
            <td><span class="position-badge">${driver.position}</span></td>
            <td style="font-family: var(--font-mono); color: var(--accent-secondary);">#${driver.carNumber}</td>
            <td style="font-weight: 600;">${escapeHtml(driver.driverName)}</td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem;">${lastLap}</td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-primary);">${bestLap}</td>
            <td style="font-family: var(--font-mono); font-size: 0.8rem;">
                ${driver.gapToLeader === 0 ? '-' : `+${Math.abs(driver.gapToLeader).toFixed(3)}s`}
            </td>
        </tr>
    `}).join('');
}

function updateRPMLEDs(rpm) {
    // Get RPM percentage (assuming max RPM, we'll use the actual value)
    // iRacing provides RPM as actual value, we need to calculate percentage
    // Most cars redline around 6000-9000 RPM, we'll use a dynamic approach

    const leds = document.querySelectorAll('.rpm-led');
    const rpmValue = document.getElementById('rpmValue');
    if (!leds || leds.length === 0) return;

    // Get max RPM from the current RPM if it's high, otherwise use a default
    // This is a simple heuristic - in practice, you'd get this from car data
    const estimatedMaxRPM = Math.max(rpm * 1.2, 8000); // Estimate max as 120% of current or 8000
    const rpmPercentage = (rpm / estimatedMaxRPM) * 100;

    // Determine RPM color based on percentage
    let rpmColor = '#00ff00'; // Green
    if (rpmPercentage >= 90) {
        rpmColor = '#ff0000'; // Red
    } else if (rpmPercentage >= 70) {
        rpmColor = '#ffff00'; // Yellow
    }

    // Update RPM value color
    if (rpmValue) {
        rpmValue.style.color = rpmColor;
    }

    // Light up LEDs based on percentage
    leds.forEach(led => {
        const threshold = parseInt(led.getAttribute('data-threshold'));
        if (rpmPercentage >= threshold) {
            led.classList.add('active');
        } else {
            led.classList.remove('active');
        }
    });
}

let showRelativePitInfo = false;

function updatePitInfo() {
    const container = document.getElementById('pitInfoContainer');
    if (!container) return;

    // Get current standings to match car indices with driver info
    const standings = currentTelemetry?.standings || [];

    if (pitStopData.size === 0) {
        container.innerHTML = '<div class="no-data">No pit stop data available</div>';
        return;
    }

    // Convert pit data to array and merge with standings
    const pitInfo = Array.from(pitStopData.values()).map(pit => {
        const driver = standings.find(d => d.carIdx === pit.carIdx);
        return {
            ...pit,
            carNumber: driver?.carNumber || '?',
            driverName: driver?.driverName || 'Unknown',
            position: driver?.position || '--',
            isMe: driver?.isMe || false
        };
    });

    // Sort by position
    pitInfo.sort((a, b) => {
        if (a.position === '--') return 1;
        if (b.position === '--') return -1;
        return a.position - b.position;
    });

    // Filter for relative if needed
    let displayData = pitInfo;
    if (showRelativePitInfo && currentTelemetry?.position) {
        const myPos = currentTelemetry.position;
        displayData = pitInfo.filter(p => {
            if (p.position === '--') return false;
            return Math.abs(p.position - myPos) <= 5; // Show ±5 positions
        });
    }

    // Build HTML
    if (displayData.length === 0) {
        container.innerHTML = '<div class="no-data">No pit stops in range</div>';
        return;
    }

    const html = `
        <table class="pit-info-table">
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>#</th>
                    <th>Driver</th>
                    <th>Pit Lap</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>
                ${displayData.map(p => `
                    <tr class="${p.isMe ? 'current' : ''}">
                        <td>${p.position}</td>
                        <td>${p.carNumber}</td>
                        <td>${p.driverName}</td>
                        <td>${p.lapNumber}</td>
                        <td>${p.duration.toFixed(2)}s</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Initialize pit info toggle
const pitAllBtn = document.getElementById('pitAllBtn');
const pitRelBtn = document.getElementById('pitRelBtn');

if (pitAllBtn && pitRelBtn) {
    pitAllBtn.addEventListener('click', () => {
        showRelativePitInfo = false;
        pitAllBtn.classList.add('active');
        pitRelBtn.classList.remove('active');
        updatePitInfo();
    });

    pitRelBtn.addEventListener('click', () => {
        showRelativePitInfo = true;
        pitRelBtn.classList.add('active');
        pitAllBtn.classList.remove('active');
        updatePitInfo();
    });
}

function updateTrackMap(runningOrder) {
    const carMarkers = document.getElementById('carMarkers');
    if (!carMarkers || !runningOrder) return;

    // Clear existing markers
    carMarkers.innerHTML = '';

    // Track parameters
    const centerX = 100;
    const centerY = 100;
    const radius = 80;

    // Create markers for each car
    runningOrder.forEach(driver => {
        const lapPct = driver.lapDistPct || 0;

        // Convert lap percentage to angle (0% = top, clockwise)
        // Subtract 90 degrees to start at top instead of right
        const angle = (lapPct * 360 - 90) * (Math.PI / 180);

        // Calculate position on circle
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // Determine color
        let color = '#0088ff'; // Default blue
        if (driver.isMe) {
            color = '#00ff88'; // Player is green
        }

        // Create circle marker
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', driver.isMe ? '5' : '3');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', driver.isMe ? '#ffffff' : 'none');
        circle.setAttribute('stroke-width', '1');

        // Add tooltip with driver info
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `#${driver.carNumber} ${driver.driverName} - P${driver.position}`;
        circle.appendChild(title);

        carMarkers.appendChild(circle);
    });
}

let lastFlagStatus = null;

function updateFlagStatus(sessionFlags) {
    const flagIndicator = document.getElementById('flagIndicator');
    const flagText = document.getElementById('flagText');
    const raceControlCard = document.querySelector('[data-card-id="race-control"]');

    if (!flagIndicator || !flagText) return;

    // iRacing flag bits
    const FLAG_CHECKERED = 0x00000001;
    const FLAG_WHITE = 0x00000002;
    const FLAG_GREEN = 0x00000004;
    const FLAG_YELLOW = 0x00000008;
    const FLAG_RED = 0x00000010;
    const FLAG_BLUE = 0x00000020;
    const FLAG_DEBRIS = 0x00000040;
    const FLAG_CROSSED = 0x00000080;
    const FLAG_YELLOW_WAVING = 0x00000100;
    const FLAG_ONE_LAP_TO_GREEN = 0x00000200;
    const FLAG_GREEN_HELD = 0x00000400;
    const FLAG_TEN_TO_GO = 0x00000800;
    const FLAG_FIVE_TO_GO = 0x00001000;
    const FLAG_RANDOM_WAVING = 0x00002000;
    const FLAG_CAUTION = 0x00004000;
    const FLAG_CAUTION_WAVING = 0x00008000;

    // Determine current flag (check yellow first as it's most common during pace)
    let flagClass = 'flag-green';
    let flagName = 'GREEN';
    let flashColor = '#00ff00';

    if (sessionFlags & FLAG_CHECKERED) {
        flagClass = 'flag-checkered';
        flagName = 'CHECKERED';
        flashColor = '#ffffff';
    } else if (sessionFlags & FLAG_WHITE) {
        flagClass = 'flag-white';
        flagName = 'WHITE';
        flashColor = '#ffffff';
    } else if (sessionFlags & FLAG_RED) {
        flagClass = 'flag-red';
        flagName = 'RED';
        flashColor = '#ff0000';
    } else if (sessionFlags & (FLAG_YELLOW | FLAG_YELLOW_WAVING | FLAG_CAUTION | FLAG_CAUTION_WAVING | FLAG_ONE_LAP_TO_GREEN)) {
        flagClass = 'flag-yellow';
        flagName = 'YELLOW';
        flashColor = '#ffff00';
    } else if (sessionFlags & FLAG_GREEN) {
        flagClass = 'flag-green';
        flagName = 'GREEN';
        flashColor = '#00ff00';
    }

    // Update flag display
    flagIndicator.className = `flag-indicator ${flagClass}`;
    flagText.textContent = flagName;

    // Trigger blink animation if flag changed
    if (lastFlagStatus !== null && lastFlagStatus !== flagName && raceControlCard) {
        // Remove old animation classes
        raceControlCard.classList.remove('flag-blink', 'flag-blink-green', 'flag-blink-yellow', 'flag-blink-red', 'flag-blink-white', 'flag-blink-checkered');

        // Set CSS variable for flash color
        raceControlCard.style.setProperty('--flash-color', flashColor);

        // Force reflow to restart animation
        void raceControlCard.offsetWidth;

        // Add appropriate blink class
        raceControlCard.classList.add('flag-blink');

        // Remove animation class after it completes
        setTimeout(() => {
            raceControlCard.classList.remove('flag-blink');
        }, 3000);
    }

    lastFlagStatus = flagName;
}

function updateTireMonitor(tires) {
    const tirePositions = ['LF', 'RF', 'LR', 'RR'];
    tirePositions.forEach(pos => {
        const tireData = tires[pos];
        if (!tireData) return;

        const pressureEl = document.getElementById(`tire${pos}Pressure`);
        const tempEl = document.getElementById(`tire${pos}Temp`);
        const wearEl = document.getElementById(`tire${pos}Wear`);

        if (pressureEl) {
            const pressure = isImperial ? UnitConverter.kpaToPsi(tireData.pressure) : tireData.pressure;
            pressureEl.textContent = UnitConverter.formatPressure(pressure, isImperial);
        }
        if (tempEl) {
            // Average the 3 temps
            const avgTemp = (tireData.tempL + tireData.tempM + tireData.tempR) / 3;
            const temp = isImperial ? UnitConverter.celsiusToFahrenheit(avgTemp) : avgTemp;
            tempEl.textContent = UnitConverter.formatTemperature(temp, isImperial);
        }
        if (wearEl) {
            // Wear is usually % remaining. iRacing gives wearL, wearM, wearR (0-1, 1 is new).
            // We'll take the minimum wear (most worn part).
            const minWear = Math.min(tireData.wearL, tireData.wearM, tireData.wearR);
            const wearPct = minWear * 100;
            wearEl.style.width = `${wearPct}%`;

            // Reset classes
            wearEl.className = 'tire-wear-fill';

            // Add color classes based on wear
            if (wearPct < 30) {
                wearEl.classList.add('critical');
            } else if (wearPct < 60) {
                wearEl.classList.add('worn');
            }
        }
    });
}

// Utility Functions

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

// Error Handling
socket.on('error', (error) => {
    console.error('Socket error:', error);
});

// Initialize drag and resize functionality
function initApp() {
    initializeDragAndResize();
    initializeUnitToggle();
    initializeStandingsToggle();
    console.log('MTEL Frontend initialized with drag & resize support');
    console.log('Press Ctrl+Shift+R to reset layout');

    // Update Check
    const updateBtn = document.getElementById('updateBtn');
    const updateStatus = document.getElementById('updateStatus');

    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            updateStatus.textContent = 'Checking...';
            // Mock update check
            setTimeout(() => {
                updateStatus.textContent = 'You are on the latest version (v2.0.0)';
                updateStatus.style.color = 'var(--accent-success)';
            }, 1000);
        });
    }

    // Initialize Window Controls & Card Management
    initWindowControls();
    initCardManagement();
}

// Window Controls & Overlay Logic
function initWindowControls() {
    // Check if running in Electron (more robust check)
    const isElectron = (typeof process !== 'undefined' && process.versions && !!process.versions.electron) ||
        (navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);

    if (isElectron) {
        try {
            const { ipcRenderer } = require('electron');

            // Expose API for other functions
            window.electronAPI = {
                toggleClickThrough: (state) => ipcRenderer.send('toggle-click-through', state),
                onClickThroughToggled: (callback) => ipcRenderer.on('click-through-toggled', callback)
            };

            const windowControls = document.getElementById('windowControls');
            if (windowControls) windowControls.style.display = 'flex';

            const minBtn = document.getElementById('minBtn');
            const maxBtn = document.getElementById('maxBtn');
            const closeBtn = document.getElementById('closeBtn');

            if (minBtn) minBtn.addEventListener('click', () => ipcRenderer.send('window-minimize'));
            if (maxBtn) maxBtn.addEventListener('click', () => ipcRenderer.send('window-maximize'));
            if (closeBtn) closeBtn.addEventListener('click', () => ipcRenderer.send('window-close'));

            // Overlay Toggle
            const overlayBtn = document.getElementById('overlayBtn');
            let isOverlay = false;

            if (overlayBtn) {
                overlayBtn.addEventListener('click', () => {
                    isOverlay = !isOverlay;
                    document.body.classList.toggle('overlay-mode');
                    document.documentElement.classList.toggle('overlay-mode'); // Toggle on html tag too
                    ipcRenderer.send('toggle-overlay', isOverlay);
                    overlayBtn.style.color = isOverlay ? 'var(--accent-primary)' : 'inherit';
                });
            }
        } catch (e) {
            console.error('Failed to initialize Electron controls:', e);
        }
    }
}

// Card Management (Close & Restore)
function initCardManagement() {
    const contextMenu = document.getElementById('cardContextMenu');
    const contextMenuList = document.getElementById('contextMenuList');
    const cards = document.querySelectorAll('.card');

    // Close Buttons
    document.querySelectorAll('.card-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                card.style.display = 'none';
                saveCardVisibility(card.dataset.cardId, false);
            }
        });
    });

    // Context Menu (Right Click)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        // Populate menu
        contextMenuList.innerHTML = '';
        cards.forEach(card => {
            const cardId = card.dataset.cardId;
            const title = card.querySelector('.card-title').textContent;
            const isVisible = card.style.display !== 'none';

            const item = document.createElement('div');
            item.className = `context-menu-item ${isVisible ? 'active' : ''}`;
            item.innerHTML = `
                <div class="context-menu-checkbox"></div>
                <span>${title}</span>
            `;

            item.addEventListener('click', () => {
                const newVisibility = !isVisible;
                card.style.display = newVisibility ? 'flex' : 'none';
                saveCardVisibility(cardId, newVisibility);
                contextMenu.style.display = 'none';
            });

            contextMenuList.appendChild(item);
        });

        // Position and show menu
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.display = 'block';
    });
    // Lock Overlay Logic
    const lockOverlayBtn = document.getElementById('lockOverlayBtn');
    if (lockOverlayBtn) {
        lockOverlayBtn.addEventListener('click', () => {
            if (window.electronAPI) {
                window.electronAPI.toggleClickThrough(true);
                // Visual feedback
                lockOverlayBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM12 4c1.1 0 2 .9 2 2v2h-4V6c0-1.1.9-2 2-2zm6 14H6V8h12v10z"/>
                </svg>
            `;
                lockOverlayBtn.classList.add('active');
                lockOverlayBtn.title = "Overlay Locked (Ctrl+Shift+L to Unlock)";

                // Show toast or notification
                const toast = document.createElement('div');
                toast.className = 'toast-notification';
                toast.textContent = 'Overlay Locked. Press Ctrl+Shift+L to Unlock.';
                toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 255, 136, 0.9);
                color: #000;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: bold;
                z-index: 9999;
                animation: fadeOut 4s forwards;
            `;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 4000);
            }
        });
    }

    // Listen for unlock event from main process
    if (window.electronAPI) {
        window.electronAPI.onClickThroughToggled((event, isLocked) => {
            if (!isLocked && lockOverlayBtn) {
                lockOverlayBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
            `;
                lockOverlayBtn.classList.remove('active');
                lockOverlayBtn.title = "Lock Overlay (Click-Through)";
            }
        });
    }

    // Hide context menu on click elsewhere
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    // Restore visibility state
    cards.forEach(card => {
        const cardId = card.dataset.cardId;
        const isVisible = localStorage.getItem(`mtel-card-visible-${cardId}`);
        if (isVisible === 'false') {
            card.style.display = 'none';
        }
    });
}

// Add keyframes for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

function saveCardVisibility(cardId, isVisible) {
    localStorage.setItem(`mtel-card-visible-${cardId}`, isVisible);
}

// Link handler functions for desktop app and browser
function openHistory() {
    if (window.electronAPI) {
        // Desktop app
        window.electronAPI.openHistory();
    } else {
        // Browser
        window.open('history.html', '_blank');
    }
}

function openButtonBox() {
    if (window.electronAPI) {
        // Desktop app
        window.electronAPI.openButtonBox();
    } else {
        // Browser
        window.open('buttonbox.html', '_blank');
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded, run immediately
    initApp();
}
