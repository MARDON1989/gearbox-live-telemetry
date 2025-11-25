# iRacing Telemetry System

A real-time telemetry system for iRacing that captures lap times from multiple simulators on a local network and displays them in a central web GUI suitable for OBS overlays.

## Architecture

- **Backend Server** (Node.js + Express + Socket.io): Central hub that receives telemetry data from agents and serves the web GUI
- **Frontend GUI** (HTML/CSS/JS): Real-time overlay displaying lap times, best laps, and connected drivers
- **Python Agents**: Lightweight clients running on each simulator that capture iRacing telemetry and send it to the server

## Features

- ✅ Real-time lap time tracking across multiple simulators
- ✅ Session best lap display
- ✅ Live driver connection status
- ✅ OBS-ready overlay design with transparent background
- ✅ WebSocket-based communication for instant updates
- ✅ REST API for historical data access

## Quick Start

### 1. Server Setup

The server should run on a central machine accessible to all simulators on your network.

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:3000`

### 2. Agent Setup (On Each Simulator)

**Requirements:**
- Windows (iRacing requirement)
- Python 3.7+
- iRacing installed

**Installation:**

```bash
cd agent
pip install -r requirements.txt
```

**Configuration:**

Edit `start_agent.bat` and set:
- `DRIVER_NAME` to your name/identifier
- Update `SERVER_URL` in `agent.py` to point to your server's IP (e.g., `http://192.168.1.100:3000`)

**Running:**

Double-click `start_agent.bat` or run:
```bash
python agent.py
```

The agent will automatically detect when iRacing is running and start sending telemetry.

### 3. OBS Setup

1. Add a **Browser Source** in OBS
2. Set URL to: `http://YOUR_SERVER_IP:3000`
3. Set Width: 600, Height: 800 (adjust as needed)
4. Check "Shutdown source when not visible" for performance
5. Refresh browser source when needed

## Configuration

### Server Configuration

Edit `backend/server.js`:
- `PORT`: Change the server port (default: 3000)

### Agent Configuration

Edit `agent/agent.py`:
- `SERVER_URL`: Your server's address
- `DRIVER_NAME`: Your display name

## API Endpoints

The server provides REST API endpoints for external integrations:

- `GET /api/laps` - Get all recorded laps
- `GET /api/laps/recent/:count` - Get recent N laps
- `GET /api/agents` - Get connected agents
- `GET /api/stats` - Get session statistics

## Project Structure

```
MARDON/
├── backend/
│   ├── server.js          # Main server application
│   └── package.json       # Node.js dependencies
├── frontend/
│   ├── index.html         # Overlay HTML
│   ├── style.css          # Overlay styling
│   └── app.js             # Client-side logic
└── agent/
    ├── agent.py           # Python telemetry agent
    ├── requirements.txt   # Python dependencies
    └── start_agent.bat    # Windows launcher
```

## Network Setup

For multi-computer setup:

1. **Find Server IP**: Run `ipconfig` (Windows) or `hostname -I` (Linux) on the server machine
2. **Update Agents**: Change `SERVER_URL` in each agent's `agent.py` to `http://SERVER_IP:3000`
3. **Firewall**: Ensure port 3000 is open on the server machine
4. **Same Network**: All machines must be on the same local network

## Troubleshooting

### Agent won't connect
- Verify server is running
- Check `SERVER_URL` is correct (use IP address, not localhost)
- Ensure firewall allows port 3000
- Check network connectivity

### No telemetry data
- Ensure iRacing is running and in a session
- Check agent console for errors
- Verify iRacing SDK is accessible (run as administrator if needed)

### OBS overlay not updating
- Refresh the browser source
- Check browser console for errors (right-click > Inspect)
- Verify server URL is correct

## Development

### Running in Development Mode

Backend with auto-reload:
```bash
cd backend
npm install -g nodemon
npm run dev
```

### Adding Features

- **Server**: Edit `backend/server.js`
- **GUI**: Edit `frontend/app.js` and `frontend/style.css`
- **Agent**: Edit `agent/agent.py`

## License

MIT

## Credits

Built with:
- [pyirsdk](https://github.com/kutu/pyirsdk) - iRacing SDK for Python
- [Socket.io](https://socket.io/) - Real-time communication
- [Express](https://expressjs.com/) - Web server framework
