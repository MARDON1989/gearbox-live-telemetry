# MTEL Easy Installer - User Guide

## What This Does

The MTEL Easy Installer automatically:
- ✅ Installs Node.js (for the server)
- ✅ Installs Python (for the telemetry agent)
- ✅ Installs Visual Studio Build Tools with Windows SDK (for native modules)
- ✅ Installs all MTEL dependencies
- ✅ Creates desktop shortcuts for easy launching
- ✅ Configures everything automatically

**No technical knowledge required!**

## How to Use

### Method 1: PowerShell Script (Recommended)

1. **Download MTEL** to your computer (e.g., `C:\Downloads\MTEL`)

2. **Right-click on `install.ps1`** and select **"Run with PowerShell"**
   - If that doesn't work, continue to step 3

3. **Open PowerShell as Administrator**:
   - Press `Windows Key`
   - Type "PowerShell"
   - Right-click "Windows PowerShell"
   - Select "Run as administrator"

4. **Run the installer**:
   ```powershell
   cd C:\Downloads\MTEL
   Set-ExecutionPolicy Bypass -Scope Process -Force
   .\install.ps1
   ```

5. **Wait for installation** (10-20 minutes)
   - The script will show progress for each step
   - Visual Studio Build Tools takes the longest

6. **Done!** Desktop shortcuts will be created:
   - **MTEL Server** - Start this first
   - **MTEL Agent** - Start this second (after server is running)

### Method 2: One-Click Installer (Coming Soon)

We can create a `.exe` installer using Inno Setup that does everything with one click.

## After Installation

### First Time Setup

1. **Configure your driver name**:
   - Navigate to `C:\Users\YourName\MTEL\agent`
   - Edit `start_agent.bat` in Notepad
   - Change `DRIVER_NAME=YourName` to your actual name

2. **Start the server**:
   - Double-click **"MTEL Server"** on your desktop
   - Wait for "MTEL Server running on port 3000"

3. **Open the dashboard**:
   - Open your browser
   - Go to http://localhost:3000

4. **Start the agent**:
   - Double-click **"MTEL Agent"** on your desktop
   - Wait for "Waiting for iRacing..."

5. **Start racing**:
   - Launch iRacing
   - Join a session
   - Start driving!

## Troubleshooting

### "Script execution is disabled"

If you see this error, run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
```

### Installation fails

1. Make sure you're running PowerShell **as Administrator**
2. Check your internet connection
3. Temporarily disable antivirus
4. Restart your computer and try again

### Server won't start

- Make sure port 3000 isn't being used by another application
- Check Windows Firewall settings

## What Gets Installed

### Software
- **Node.js LTS** (~50 MB)
- **Python 3.11** (~30 MB)
- **Visual Studio Build Tools 2022** (~2-3 GB)
- **Chocolatey** (package manager)

### MTEL Files
- Installed to: `C:\Users\YourName\MTEL`
- Desktop shortcuts created
- Start scripts created

## Uninstalling

To remove MTEL:

1. Delete the MTEL folder: `C:\Users\YourName\MTEL`
2. Delete desktop shortcuts
3. (Optional) Uninstall Node.js, Python, and VS Build Tools via Windows Settings

## Network Setup (Multiple Computers)

If you want to run the server on one computer and agents on others:

1. **On the server computer**:
   - Find your IP address: `ipconfig` in Command Prompt
   - Note the "IPv4 Address" (e.g., 192.168.1.100)
   - Allow port 3000 in Windows Firewall

2. **On agent computers**:
   - Edit `start_agent.bat`
   - Change `SERVER_URL=http://localhost:3000` to `SERVER_URL=http://192.168.1.100:3000`

## Support

For issues or questions:
- Check the main README.md
- Check WINDOWS_INSTALL.md for manual installation
- Review the error messages in the PowerShell window

## Advanced: Building an EXE Installer

If you want a one-click `.exe` installer, you can use Inno Setup:

1. Install Inno Setup: https://jrsoftware.org/isinfo.php
2. Use the `installer.iss` script (if provided)
3. Compile to create `MTEL-Setup.exe`
4. Distribute the single `.exe` file

This creates a professional Windows installer with:
- Graphical wizard interface
- Automatic dependency installation
- Start menu shortcuts
- Uninstaller
- Version checking
