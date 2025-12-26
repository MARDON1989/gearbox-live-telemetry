# MTEL API Documentation

Complete REST API and WebSocket event documentation for the MTEL server.

## Base URL

```
http://localhost:3000/api
```

## REST API Endpoints

### Sessions

#### Get Recent Sessions
```
GET /api/sessions?limit=20
```

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 20)

**Response:**
```json
[
  {
    "id": 1,
    "driver_name": "John Doe",
    "computer_name": "RACING-PC",
    "track_name": "Watkins Glen International",
    "track_config": "Boot",
    "car_name": "Mazda MX-5 Cup",
    "car_class": "MX5",
    "session_type": "Practice",
    "started_at": "2024-01-15T10:30:00Z",
    "ended_at": "2024-01-15T11:15:00Z",
    "total_laps": 15,
    "best_lap_time": 125.432
  }
]
```

#### Get Session Details
```
GET /api/sessions/:id
```

**Response:** Single session object (same structure as above)

#### Get Session Laps
```
GET /api/sessions/:id/laps?limit=50
```

**Query Parameters:**
- `limit` (optional): Number of laps to return

**Response:**
```json
[
  {
    "id": 1,
    "session_id": 1,
    "lap_number": 5,
    "lap_time": 125.432,
    "sector1_time": 41.234,
    "sector2_time": 42.567,
    "sector3_time": 41.631,
    "is_valid": 1,
    "fuel_level": 12.5,
    "fuel_used": 1.8,
    "position": 3,
    "class_position": 2,
    "gap_to_leader": 5.234,
    "gap_to_ahead": 2.145,
    "gap_to_behind": 3.456,
    "timestamp": "2024-01-15T10:45:23Z"
  }
]
```

#### Get Best Lap
```
GET /api/sessions/:id/best-lap
```

**Response:** Single lap object (same structure as above)

### Fuel Analysis

#### Get Fuel Analysis
```
GET /api/sessions/:id/fuel
```

**Response:**
```json
{
  "id": 1,
  "session_id": 1,
  "avg_fuel_per_lap": 1.75,
  "laps_remaining": 7.14,
  "total_fuel_used": 26.25,
  "updated_at": "2024-01-15T11:00:00Z"
}
```

### Drivers

#### Get Driver Statistics
```
GET /api/drivers/:name/stats
```

**Response:**
```json
{
  "total_sessions": 45,
  "total_laps": 678,
  "best_lap_time": 118.234,
  "avg_lap_time": 122.567
}
```

### System

#### Get Connected Agents
```
GET /api/agents
```

**Response:**
```json
[
  {
    "id": "socket-id-123",
    "driverName": "John Doe",
    "computerName": "RACING-PC",
    "connectedAt": "2024-01-15T10:30:00Z",
    "lastUpdate": "2024-01-15T11:00:00Z",
    "currentTrack": "Watkins Glen International",
    "currentCar": "Mazda MX-5 Cup",
    "sessionId": 1
  }
]
```

#### Get Overall Statistics
```
GET /api/stats
```

**Response:**
```json
{
  "totalSessions": 45,
  "activeAgents": 2,
  "drivers": ["John Doe", "Jane Smith"],
  "tracks": ["Watkins Glen International", "Road Atlanta"],
  "cars": ["Mazda MX-5 Cup", "BMW M4 GT4"]
}
```

#### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600.5,
  "activeAgents": 2,
  "activeSessions": 1,
  "database": "connected"
}
```

## WebSocket Events

### Client → Server Events

#### Register Agent
```javascript
socket.emit('register-agent', {
  driverName: 'John Doe',
  computerName: 'RACING-PC'
});
```

#### Session Start
```javascript
socket.emit('session-start', {
  trackName: 'Watkins Glen International',
  trackConfig: 'Boot',
  carName: 'Mazda MX-5 Cup',
  carClass: 'MX5',
  sessionType: 'Practice'
});
```

#### Telemetry Data
```javascript
socket.emit('telemetry-data', {
  // Lap completion
  lapCompleted: true,
  lapNumber: 5,
  lapTime: 125.432,
  sector1Time: 41.234,
  sector2Time: 42.567,
  sector3Time: 41.631,
  isValid: true,
  fuelLevel: 12.5,
  fuelUsed: 1.8,
  position: 3,
  classPosition: 2,
  gapToLeader: 5.234,
  gapToAhead: 2.145,
  gapToBehind: 3.456,
  fuelAnalysis: {
    avgFuelPerLap: 1.75,
    lapsRemaining: 7.14,
    totalFuelUsed: 26.25
  }
});

// OR Live snapshot
socket.emit('telemetry-data', {
  snapshot: true,
  lapNumber: 5,
  speed: 145.6,
  rpm: 6500,
  gear: 4,
  throttle: 0.85,
  brake: 0.0,
  fuelLevel: 12.5,
  lapDistPct: 0.45,
  currentLapTime: 62.5,
  bestLapTime: 125.432,
  last5Laps: [125.432, 126.123, 125.987, 126.456, 125.678],
  position: 3,
  classPosition: 2
});
```

#### Session End
```javascript
socket.emit('session-end', {
  totalLaps: 15,
  bestLapTime: 125.432
});
```

### Server → Client Events

#### Initial Data
```javascript
socket.on('initial-data', (data) => {
  // data.agents: Array of connected agents
  // data.recentSessions: Array of recent sessions
});
```

#### Agents Update
```javascript
socket.on('agents-update', (agents) => {
  // Array of currently connected agents
});
```

#### Session Started
```javascript
socket.on('session-started', (data) => {
  // agentId, sessionId, driverName, trackName, carName, etc.
});
```

#### Session Ended
```javascript
socket.on('session-ended', (data) => {
  // agentId, sessionId, driverName, totalLaps, bestLapTime
});
```

#### Lap Completed
```javascript
socket.on('lap-completed', (data) => {
  // agentId, driverName, lapId, sessionId, lapNumber, lapTime, etc.
});
```

#### Live Telemetry
```javascript
socket.on('live-telemetry', (data) => {
  // agentId, driverName, sessionId, speed, rpm, gear, etc.
});
```

## Data Models

### Session
```typescript
interface Session {
  id: number;
  driver_name: string;
  computer_name: string;
  track_name: string;
  track_config: string;
  car_name: string;
  car_class: string;
  session_type: string;
  started_at: string;  // ISO 8601 datetime
  ended_at: string | null;
  total_laps: number;
  best_lap_time: number | null;
}
```

### Lap
```typescript
interface Lap {
  id: number;
  session_id: number;
  lap_number: number;
  lap_time: number;
  sector1_time: number | null;
  sector2_time: number | null;
  sector3_time: number | null;
  is_valid: boolean;
  fuel_level: number | null;
  fuel_used: number | null;
  position: number | null;
  class_position: number | null;
  gap_to_leader: number | null;
  gap_to_ahead: number | null;
  gap_to_behind: number | null;
  timestamp: string;  // ISO 8601 datetime
}
```

### Fuel Analysis
```typescript
interface FuelAnalysis {
  id: number;
  session_id: number;
  avg_fuel_per_lap: number;
  laps_remaining: number;
  total_fuel_used: number;
  updated_at: string;  // ISO 8601 datetime
}
```

### Agent
```typescript
interface Agent {
  id: string;  // Socket ID
  driverName: string;
  computerName: string;
  connectedAt: Date;
  lastUpdate: Date;
  currentTrack: string | null;
  currentCar: string | null;
  sessionId: number | null;
}
```

## Error Responses

All API endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `404` - Resource not found
- `500` - Internal server error
