/**
 * MTEL Database Module
 * Handles SQLite database operations for telemetry data storage
 */

const Database = require('better-sqlite3');
const path = require('path');

class TelemetryDatabase {
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initializeTables();
    }

    initializeTables() {
        // Sessions table - stores racing sessions
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_name TEXT NOT NULL,
                computer_name TEXT NOT NULL,
                track_name TEXT NOT NULL,
                track_config TEXT,
                car_name TEXT NOT NULL,
                car_class TEXT,
                session_type TEXT,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME,
                total_laps INTEGER DEFAULT 0,
                best_lap_time REAL
            )
        `);

        // Laps table - stores individual lap data
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS laps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                lap_number INTEGER NOT NULL,
                lap_time REAL NOT NULL,
                sector1_time REAL,
                sector2_time REAL,
                sector3_time REAL,
                is_valid BOOLEAN DEFAULT 1,
                fuel_level REAL,
                fuel_used REAL,
                position INTEGER,
                class_position INTEGER,
                gap_to_leader REAL,
                gap_to_ahead REAL,
                gap_to_behind REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        `);

        // Telemetry snapshots - stores real-time telemetry data
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS telemetry_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                lap_number INTEGER,
                speed REAL,
                rpm REAL,
                gear INTEGER,
                throttle REAL,
                brake REAL,
                fuel_level REAL,
                lap_distance_pct REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        `);

        // Pit stops table - stores pit stop events
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS pit_stops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                lap_number INTEGER NOT NULL,
                driver_name TEXT NOT NULL,
                pit_time REAL,
                fuel_added REAL,
                tires_changed TEXT,
                repairs TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        `);

        // Button layouts table - stores button box configurations
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS button_layouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                layout_name TEXT NOT NULL DEFAULT 'default',
                layout_data TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Fuel consumption analysis
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS fuel_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                avg_fuel_per_lap REAL,
                laps_remaining REAL,
                total_fuel_used REAL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        `);

        // Create indexes for better query performance
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_laps_session ON laps(session_id);
            CREATE INDEX IF NOT EXISTS idx_laps_lap_number ON laps(lap_number);
            CREATE INDEX IF NOT EXISTS idx_telemetry_session ON telemetry_snapshots(session_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_driver ON sessions(driver_name);
        `);
    }

    // Session operations
    createSession(data) {
        const stmt = this.db.prepare(`
            INSERT INTO sessions (driver_name, computer_name, track_name, track_config, car_name, car_class, session_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            data.driverName,
            data.computerName,
            data.trackName,
            data.trackConfig || '',
            data.carName,
            data.carClass || '',
            data.sessionType || 'Practice'
        );
        return result.lastInsertRowid;
    }

    updateSession(sessionId, data) {
        const stmt = this.db.prepare(`
            UPDATE sessions 
            SET ended_at = CURRENT_TIMESTAMP, 
                total_laps = ?, 
                best_lap_time = ?
            WHERE id = ?
        `);
        stmt.run(data.totalLaps, data.bestLapTime, sessionId);
    }

    getSession(sessionId) {
        const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
        return stmt.get(sessionId);
    }

    getRecentSessions(limit = 10) {
        const stmt = this.db.prepare(`
            SELECT * FROM sessions 
            ORDER BY started_at DESC 
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    // Lap operations
    addLap(data) {
        const stmt = this.db.prepare(`
            INSERT INTO laps (
                session_id, lap_number, lap_time, sector1_time, sector2_time, sector3_time,
                is_valid, fuel_level, fuel_used, position, class_position,
                gap_to_leader, gap_to_ahead, gap_to_behind
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            data.sessionId,
            data.lapNumber,
            data.lapTime,
            data.sector1Time || null,
            data.sector2Time || null,
            data.sector3Time || null,
            data.isValid ? 1 : 0,
            data.fuelLevel || null,
            data.fuelUsed || null,
            data.position || null,
            data.classPosition || null,
            data.gapToLeader || null,
            data.gapToAhead || null,
            data.gapToBehind || null
        );
        return result.lastInsertRowid;
    }

    getSessionLaps(sessionId, limit = null) {
        let query = 'SELECT * FROM laps WHERE session_id = ? ORDER BY lap_number DESC';
        if (limit) query += ` LIMIT ${limit}`;
        const stmt = this.db.prepare(query);
        return stmt.all(sessionId);
    }

    getBestLap(sessionId) {
        const stmt = this.db.prepare(`
            SELECT * FROM laps 
            WHERE session_id = ? AND is_valid = 1 
            ORDER BY lap_time ASC 
            LIMIT 1
        `);
        return stmt.get(sessionId);
    }

    // Fuel analysis operations
    updateFuelAnalysis(sessionId, data) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO fuel_analysis (session_id, avg_fuel_per_lap, laps_remaining, total_fuel_used)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(sessionId, data.avgFuelPerLap, data.lapsRemaining, data.totalFuelUsed);
    }

    getFuelAnalysis(sessionId) {
        const stmt = this.db.prepare('SELECT * FROM fuel_analysis WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1');
        return stmt.get(sessionId);
    }

    // Telemetry snapshot operations
    addTelemetrySnapshot(data) {
        const stmt = this.db.prepare(`
            INSERT INTO telemetry_snapshots (
                session_id, lap_number, speed, rpm, gear, throttle, brake, fuel_level, lap_distance_pct
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            data.sessionId,
            data.lapNumber,
            data.speed || null,
            data.rpm || null,
            data.gear || null,
            data.throttle || null,
            data.brake || null,
            data.fuelLevel || null,
            data.lapDistPct || null
        );
    }

    // Statistics
    getDriverStats(driverName) {
        const stmt = this.db.prepare(`
            SELECT 
                COUNT(DISTINCT s.id) as total_sessions,
                COUNT(l.id) as total_laps,
                MIN(l.lap_time) as best_lap_time,
                AVG(l.lap_time) as avg_lap_time
            FROM sessions s
            LEFT JOIN laps l ON s.id = l.session_id
            WHERE s.driver_name = ? AND l.is_valid = 1
        `);
        return stmt.get(driverName);
    }

    // Historical data queries for history viewer
    getAllSessions(filters = {}) {
        let query = 'SELECT * FROM sessions WHERE 1=1';
        const params = [];

        if (filters.driverName) {
            query += ' AND driver_name LIKE ?';
            params.push(`%${filters.driverName}%`);
        }
        if (filters.trackName) {
            query += ' AND track_name LIKE ?';
            params.push(`%${filters.trackName}%`);
        }
        if (filters.carName) {
            query += ' AND car_name LIKE ?';
            params.push(`%${filters.carName}%`);
        }
        if (filters.startDate) {
            query += ' AND started_at >= ?';
            params.push(filters.startDate);
        }
        if (filters.endDate) {
            query += ' AND started_at <= ?';
            params.push(filters.endDate);
        }

        query += ' ORDER BY started_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    getSessionLaps(sessionId) {
        const stmt = this.db.prepare(`
            SELECT * FROM laps 
            WHERE session_id = ? 
            ORDER BY lap_number ASC
        `);
        return stmt.all(sessionId);
    }

    getSessionTelemetry(sessionId, lapNumber = null) {
        let query = 'SELECT * FROM telemetry_snapshots WHERE session_id = ?';
        const params = [sessionId];

        if (lapNumber !== null) {
            query += ' AND lap_number = ?';
            params.push(lapNumber);
        }

        query += ' ORDER BY timestamp ASC';

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    // Button Layout Methods
    saveButtonLayout(layoutName, layoutData) {
        const existing = this.db.prepare('SELECT id FROM button_layouts WHERE layout_name = ?').get(layoutName);

        if (existing) {
            const updateStmt = this.db.prepare(`
                UPDATE button_layouts 
                SET layout_data = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE layout_name = ?
            `);
            return updateStmt.run(JSON.stringify(layoutData), layoutName);
        } else {
            const insertStmt = this.db.prepare(`
                INSERT INTO button_layouts (layout_name, layout_data) 
                VALUES (?, ?)
            `);
            return insertStmt.run(layoutName, JSON.stringify(layoutData));
        }
    }

    getButtonLayout(layoutName) {
        const stmt = this.db.prepare(`
            SELECT layout_data 
            FROM button_layouts 
            WHERE layout_name = ?
            ORDER BY updated_at DESC
            LIMIT 1
        `);
        const result = stmt.get(layoutName);
        return result ? JSON.parse(result.layout_data) : null;
    }

    close() {
        this.db.close();
    }
}

module.exports = TelemetryDatabase;
