# MTEL Quick Start Guide

## Installation & Testing

### 1. Backend Server

```bash
cd /home/bryan/Documents/Projects/MTEL/backend
npm install
npm start
```

Server will run on http://localhost:3000

### 2. Python Agent (on Windows with iRacing)

```bash
cd agent
pip install -r requirements.txt

# Edit start_agent.bat first:
# - Set DRIVER_NAME to your name
# - Set SERVER_URL to your server IP

python agent.py
```

### 3. Browser Dashboard

Open browser to: http://localhost:3000

### 4. Desktop App (Optional)

```bash
cd desktop
npm install
npm start
```

## Quick Test Without iRacing

You can test the system without iRacing:

1. Start the backend server
2. Open the browser dashboard
3. You should see "Connected" status
4. The UI will display "Waiting for telemetry data"

## Features to Test

- [ ] Backend server starts successfully
- [ ] Browser dashboard loads and connects
- [ ] Agent connects to server (shows in Connected Drivers)
- [ ] iRacing session detection
- [ ] Lap time capture and display
- [ ] Fuel gauge updates
- [ ] Best lap tracking
- [ ] Last 5 laps display
- [ ] Database persistence (check telemetry.db file)
- [ ] Desktop app launches and displays dashboard

## Troubleshooting

**Server won't start**: Make sure Node.js is installed (`node --version`)

**Agent won't connect**: Check SERVER_URL in start_agent.bat

**No telemetry**: Make sure iRacing is running and in a session

**Database errors**: Check write permissions in backend directory

## Next Steps

1. Test with iRacing running
2. Verify all telemetry metrics are captured
3. Check database for stored sessions
4. Test on multiple machines (network setup)
5. Configure for OBS if needed
6. Build desktop app installer (`npm run build:win`)
