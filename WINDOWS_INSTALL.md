# MTEL Windows Installation Guide

## Prerequisites Installation

### 1. Install Windows Build Tools (Required for better-sqlite3)

**CRITICAL**: You must install Visual Studio Build Tools with Windows SDK **BEFORE** running `npm install`.

**Option A: Automated Installation (Recommended)**

Open PowerShell **as Administrator** and run:
```powershell
npm install --global windows-build-tools
```

This will automatically install:
- Visual Studio Build Tools
- Python
- Windows SDK

**Option B: Manual Installation**

1. Download **Visual Studio Build Tools 2022**: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. Run the installer
3. Select **"Desktop development with C++"** workload
4. In the right panel, make sure these are checked:
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
   - ✅ **Windows 11 SDK** (or Windows 10 SDK)
   - ✅ C++ CMake tools for Windows
5. Click "Install" (this will take 5-10 minutes)
6. **Restart your computer**

**Verify Installation:**
```cmd
where cl
```
Should show path to Visual Studio compiler.

### 2. Install Node.js (Required for Backend Server)

**Download Node.js:**
1. Go to https://nodejs.org/
2. Download the **LTS (Long Term Support)** version for Windows
3. Run the installer (`.msi` file)
4. Follow the installation wizard:
   - Accept the license agreement
   - Use default installation path
   - **IMPORTANT**: Check the box "Automatically install the necessary tools"
   - Click "Install"
5. Restart your computer after installation

**Verify Installation:**
Open Command Prompt (cmd) or PowerShell and run:
```cmd
node --version
npm --version
```

You should see version numbers like:
```
v20.10.0
10.2.3
```

### 2. Install Python (Required for Telemetry Agent)

**Download Python:**
1. Go to https://www.python.org/downloads/
2. Download Python 3.11 or newer for Windows
3. Run the installer
4. **CRITICAL**: Check "Add Python to PATH" at the bottom of the first screen
5. Click "Install Now"

**Verify Installation:**
Open Command Prompt and run:
```cmd
python --version
pip --version
```

## MTEL Installation Steps

### Step 1: Backend Server Setup

1. **Navigate to backend folder:**
```cmd
cd C:\path\to\MTEL\backend
```

2. **Install dependencies:**
```cmd
npm install
```

This will install:
- Express (web server)
- Socket.io (real-time communication)
- better-sqlite3 (database)
- cors (cross-origin support)
- dotenv (environment variables)

3. **Start the server:**
```cmd
npm start
```

You should see:
```
MTEL Server running on port 3000
GUI available at http://localhost:3000
```

**Keep this window open** - the server needs to stay running.

### Step 2: Python Agent Setup

1. **Open a NEW Command Prompt window**

2. **Navigate to agent folder:**
```cmd
cd C:\path\to\MTEL\agent
```

3. **Install Python dependencies:**
```cmd
pip install -r requirements.txt
```

This will install:
- pyirsdk (iRacing SDK)
- python-socketio (server communication)

4. **Configure the agent:**
Edit `start_agent.bat` in Notepad:
```batch
set DRIVER_NAME=YourName
set SERVER_URL=http://localhost:3000
```

5. **Run the agent:**
```cmd
start_agent.bat
```
OR
```cmd
python agent.py
```

### Step 3: Access the Dashboard

1. **Open your web browser**
2. **Go to:** http://localhost:3000
3. **You should see the MTEL dashboard**

### Step 4: Desktop Application (Optional)

1. **Navigate to desktop folder:**
```cmd
cd C:\path\to\MTEL\desktop
```

2. **Install dependencies:**
```cmd
npm install
```

3. **Run the desktop app:**
```cmd
npm start
```

4. **Build installer (optional):**
```cmd
npm run build:win
```

The installer will be in `desktop\dist\MTEL Setup.exe`

## Troubleshooting

### "npm is not recognized"

**Problem:** Node.js is not installed or not in PATH

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart your computer
3. Open a NEW Command Prompt window
4. Try `npm --version` again

### "python is not recognized"

**Problem:** Python is not installed or not in PATH

**Solution:**
1. Uninstall Python if already installed
2. Reinstall Python from https://www.python.org/
3. **CHECK "Add Python to PATH"** during installation
4. Restart your computer
5. Open a NEW Command Prompt window
6. Try `python --version` again

### "Module not found" errors

**Problem:** Dependencies not installed

**Solution:**
```cmd
# For backend
cd backend
npm install

# For agent
cd agent
pip install -r requirements.txt

# For desktop
cd desktop
npm install
```

### "better-sqlite3" installation fails / "Could not find Visual Studio"

**Problem:** Missing Windows Build Tools or Windows SDK

**Error message:**
```
gyp ERR! find VS - missing any Windows SDK
gyp ERR! find VS could not find a version of Visual Studio 2017 or newer to use
```

**Solution:**

1. **Install Visual Studio Build Tools 2022**:
   - Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Run installer
   - Select **"Desktop development with C++"**
   - Make sure **Windows 11 SDK** (or Windows 10 SDK) is checked
   - Install and **restart computer**

2. **After restart, try again:**
```cmd
cd backend
npm install
```

3. **Alternative - Use prebuilt binaries** (if build tools don't work):
```cmd
cd backend
npm install better-sqlite3 --build-from-source=false
npm install
```

### Port 3000 already in use

**Problem:** Another application is using port 3000

**Solution:**
1. Edit `backend\.env` (create if doesn't exist)
2. Add: `PORT=3001`
3. Update agent `SERVER_URL` to `http://localhost:3001`
4. Restart server

### Agent can't connect to server

**Problem:** Server not running or wrong URL

**Solution:**
1. Make sure backend server is running first
2. Check `SERVER_URL` in `start_agent.bat`
3. If server is on another computer, use that computer's IP:
   ```batch
   set SERVER_URL=http://192.168.1.100:3000
   ```

### iRacing not detected

**Problem:** iRacing SDK not accessible

**Solution:**
1. Make sure iRacing is running
2. Make sure you're in a session (not just in the UI)
3. Try running agent as Administrator:
   - Right-click `start_agent.bat`
   - Select "Run as administrator"

## Network Setup (Multiple Computers)

### Server Computer:

1. **Find your IP address:**
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

2. **Allow firewall:**
   - Windows Firewall → Allow an app
   - Add Node.js
   - Allow on Private networks

### Agent Computer(s):

1. **Edit `start_agent.bat`:**
```batch
set SERVER_URL=http://192.168.1.100:3000
```
(Replace with your server's IP)

2. **Run the agent:**
```cmd
start_agent.bat
```

## Quick Start Checklist

- [ ] Install Node.js from nodejs.org
- [ ] Install Python from python.org (check "Add to PATH")
- [ ] Restart computer
- [ ] Open Command Prompt
- [ ] Navigate to `MTEL\backend`
- [ ] Run `npm install`
- [ ] Run `npm start`
- [ ] Open NEW Command Prompt
- [ ] Navigate to `MTEL\agent`
- [ ] Run `pip install -r requirements.txt`
- [ ] Edit `start_agent.bat` with your name
- [ ] Run `start_agent.bat`
- [ ] Open browser to http://localhost:3000
- [ ] Start iRacing and begin driving!

## Getting Help

If you encounter issues:

1. Check that Node.js and Python are installed:
   ```cmd
   node --version
   npm --version
   python --version
   ```

2. Check that the server is running (Command Prompt should show "MTEL Server running")

3. Check that the agent is running (Command Prompt should show "Waiting for iRacing...")

4. Check browser console for errors (F12 in browser)

5. Make sure all computers are on the same network

## System Requirements

**Minimum:**
- Windows 10 or newer
- 4GB RAM
- Node.js 16+
- Python 3.7+
- iRacing installed

**Recommended:**
- Windows 11
- 8GB RAM
- Node.js 20 LTS
- Python 3.11+
- Dual monitors (one for racing, one for telemetry)
