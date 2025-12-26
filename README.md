# MTEL - Mardon Telemetry Enhanced

A comprehensive iRacing telemetry system with real-time data capture, historical storage, and dual UI support (browser and Windows desktop application). Forked and significantly enhanced from the MARDON project.

## 🚀 Features

### Telemetry Capture
- ✅ **Current Track & Car** - Real-time track and vehicle information
- ✅ **Comprehensive Lap Times** - Current, last, best, and last 5 laps tracking
- ✅ **Fuel Management** - Current fuel load, consumption rate, and laps remaining calculation
- ✅ **Race Position** - Overall and class position with gap tracking
- ✅ **Lap Split Times** - Sector timing analysis
- ✅ **Live Telemetry** - Speed, RPM, gear, throttle, and brake data
- ✅ **Historical Data** - SQLite database for session and lap history

### User Interfaces
- 🌐 **Browser Dashboard** - Modern, responsive web interface with premium design
- 💻 **Windows Desktop App** - Native Electron application with system tray integration
- 📊 **Real-time Updates** - WebSocket-based instant data synchronization
- 🎨 **Premium UI/UX** - Glassmorphism effects, smooth animations, dark theme

### Data Management
- 💾 **Persistent Storage** - SQLite database for all telemetry data
- 📈 **Analytics** - Fuel consumption analysis, lap time trends
- 🔍 **Historical Sessions** - Browse and analyze past racing sessions
- 📡 **REST API** - Full API access for custom integrations

## 📋 Architecture

```
MTEL/
├── backend/          # Node.js server with Express + Socket.io
│   ├── server.js     # Main server application
│   ├── database.js   # SQLite database module
│   └── package.json  # Dependencies
├── frontend/         # Browser-based UI
│   ├── index.html    # Main dashboard
│   ├── style.css     # Premium styling
│   └── app.js        # Client-side logic
├── agent/            # Python telemetry capture
│   ├── agent.py      # Enhanced iRacing agent
│   └── requirements.txt
└── desktop/          # Electron desktop app
    ├── main.js       # Electron main process
    └── package.json  # Electron dependencies
```

## 🛠️ Installation

### Prerequisites
- **Server Machine**: Node.js 16+ (for backend server)
- **Simulator Machine**: Windows, Python 3.7+, iRacing installed
- **Desktop App** (optional): Windows 10/11

### 1. Backend Server Setup

The server can run on any machine accessible to your simulators.

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:3000` and create a `telemetry.db` SQLite database.

**Environment Configuration** (optional):
Create a `.env` file in the backend directory:
```env
PORT=3000
DATABASE_PATH=./telemetry.db
```

### 2. Python Agent Setup (On Each Simulator)

**Install Dependencies:**
```bash
cd agent
pip install -r requirements.txt
```

**Configure Agent:**
Edit `start_agent.bat`:
- Set `DRIVER_NAME` to your name/identifier
- Set `SERVER_URL` to your server's IP (e.g., `http://192.168.1.100:3000`)

**Run Agent:**
Double-click `start_agent.bat` or run:
```bash
python agent.py
```

The agent will automatically detect when iRacing is running and start capturing telemetry.

### 3. Browser Interface

Simply open your web browser and navigate to:
```
http://YOUR_SERVER_IP:3000
```

The dashboard will automatically connect and display real-time telemetry.

### 4. Windows Desktop Application (Optional)

**Install Dependencies:**
```bash
cd desktop
npm install
```

**Run Desktop App:**
```bash
npm start
```

**Build Executable:**
```bash
npm run build:win
```

The installer will be created in `desktop/dist/`.

## 🎮 Usage

### Starting a Session

1. **Start the backend server** on your central machine
2. **Launch the Python agent** on each simulator machine
3. **Open the browser dashboard** or desktop app
4. **Start iRacing** and begin driving

The system will automatically:
- Detect when you're in a session
- Capture all telemetry data
- Display real-time information
- Store data in the database

### Dashboard Features

**Live Session Panel**
- Current track, car, and driver information
- Real-time session status

**Current Lap Panel**
- Live lap timer
- Current speed and gear
- Real-time telemetry

**Fuel Management**
- Visual fuel gauge
- Laps remaining calculation
- Average fuel consumption per lap

**Race Position**
- Overall and class position
- Gap to leader tracking

**Lap History**
- Last 5 laps display
- Complete lap list with best lap highlighting
- Invalid lap marking

**Connected Drivers**
- All active agents
- Current session information

## 🔌 API Endpoints

The server provides a comprehensive REST API:

### Sessions
- `GET /api/sessions` - Get recent sessions (limit query param)
- `GET /api/sessions/:id` - Get specific session details
- `GET /api/sessions/:id/laps` - Get laps for a session
- `GET /api/sessions/:id/best-lap` - Get best lap for a session
- `GET /api/sessions/:id/fuel` - Get fuel analysis for a session

### Drivers
- `GET /api/drivers/:name/stats` - Get driver statistics

### System
- `GET /api/agents` - Get connected agents
- `GET /api/stats` - Get overall statistics
- `GET /api/health` - Health check endpoint

## 🌐 Network Setup

For multi-computer setup:

1. **Find Server IP**: 
   - Windows: `ipconfig`
   - Linux: `hostname -I`

2. **Update Agents**: Change `SERVER_URL` in `start_agent.bat` to `http://SERVER_IP:3000`

3. **Firewall**: Ensure port 3000 is open on the server machine

4. **Same Network**: All machines must be on the same local network

## 🐛 Troubleshooting

### Agent Won't Connect
- Verify server is running
- Check `SERVER_URL` is correct (use IP address, not localhost)
- Ensure firewall allows port 3000
- Verify network connectivity

### No Telemetry Data
- Ensure iRacing is running and in a session
- Check agent console for errors
- Verify iRacing SDK is accessible (run as administrator if needed)

### Browser Dashboard Not Updating
- Refresh the browser
- Check browser console for errors (F12)
- Verify server URL is correct

### Desktop App Won't Start
- Ensure server is running first
- Check `SERVER_URL` in desktop/main.js
- Try running from command line to see errors

## 🔧 Development

### Running in Development Mode

**Backend with auto-reload:**
```bash
cd backend
npm run dev
```

**Desktop app in development:**
```bash
cd desktop
NODE_ENV=development npm start
```

### Database Schema

The SQLite database includes tables for:
- `sessions` - Racing session metadata
- `laps` - Individual lap data with splits and fuel
- `telemetry_snapshots` - Real-time telemetry samples
- `fuel_analysis` - Fuel consumption analytics

## 📊 OBS Integration

To use the browser dashboard as an OBS overlay:

1. Add **Browser Source** in OBS
2. Set URL to: `http://YOUR_SERVER_IP:3000`
3. Set Width: 1400, Height: 900 (adjust as needed)
4. Enable "Shutdown source when not visible" for performance
5. Refresh browser source when needed

## 🎨 Customization

### Changing Colors

Edit `frontend/style.css` and modify the CSS variables in `:root`:
```css
:root {
    --accent-primary: #00ff88;  /* Primary accent color */
    --accent-secondary: #0088ff; /* Secondary accent */
    /* ... other colors */
}
```

### Adding New Metrics

1. Capture data in `agent/agent.py`
2. Send via Socket.IO in telemetry data
3. Add database fields in `backend/database.js`
4. Display in `frontend/index.html` and `frontend/app.js`

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Credits

Built with:
- [pyirsdk](https://github.com/kutu/pyirsdk) - iRacing SDK for Python
- [Socket.io](https://socket.io/) - Real-time communication
- [Express](https://expressjs.com/) - Web server framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite database
- [Electron](https://www.electronjs.org/) - Desktop application framework

## 🚗 About MARDON

MTEL is developed by MARDON for the iRacing community. For support or feature requests, please open an issue on the project repository.

---

**Happy Racing! 🏁**
