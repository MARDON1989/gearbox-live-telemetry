@echo off
title MTEL

echo ========================================
echo MTEL - Mardon Telemetry Enhanced
echo ========================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ============================================
    echo   ERROR: Node.js not found!
    echo ============================================
    echo.
    echo MTEL requires Node.js to run.
    echo Please install Node.js from: https://nodejs.org
    echo.
    echo The installer should have installed it.
    echo Try restarting your computer to refresh PATH.
    echo.
    pause
    exit /b 1
)

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ============================================
    echo   ERROR: Python not found!
    echo ============================================
    echo.
    echo MTEL requires Python to run.
    echo Please install Python from: https://python.org
    echo.
    echo The installer should have installed it.
    echo Try restarting your computer to refresh PATH.
    echo.
    pause
    exit /b 1
)

echo Starting MTEL Backend Server...
start "MTEL Server" cmd /k "cd /d %~dp0backend && node server.js"

echo Waiting for server to start...
timeout /t 3

echo Starting MTEL Desktop Application...
start "MTEL Desktop" cmd /k "cd /d %~dp0desktop && npm start"

echo Waiting for desktop to start...
timeout /t 2

echo Starting MTEL Telemetry Agent...
start "MTEL Agent" cmd /k "cd /d %~dp0agent && python agent.py"

echo.
echo ==========================================
echo MTEL is starting...
echo ==========================================
echo.
echo Server: http://localhost:3000
echo Desktop: Electron app window
echo Agent: Running in background
echo.
echo You should see 3 windows:
echo - MTEL Server (backend)
echo - MTEL Desktop (Electron app)
echo - MTEL Agent (Python)
echo.
echo Close this window to stop MTEL
pause
