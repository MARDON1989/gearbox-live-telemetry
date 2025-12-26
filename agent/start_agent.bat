@echo off
title MTEL Telemetry Agent

REM Change to agent directory
cd /d "%~dp0"

echo ========================================
echo MTEL - Mardon Telemetry Enhanced Agent
echo ========================================
echo.

REM Set your driver name here
set DRIVER_NAME=YourName

REM Set server URL (change to your server's IP address)
REM set SERVER_URL=http://192.168.1.100:3000
set SERVER_URL=http://localhost:3000

echo Driver: %DRIVER_NAME%
echo Server: %SERVER_URL%
echo.

REM Use bundled Python
set "PYTHON=%~dp0..\python\python.exe"

REM Check if bundled Python exists
if not exist "%PYTHON%" (
    echo ============================================
    echo   ERROR: Python not found!
    echo ============================================
    echo.
    echo Bundled Python is missing.
    echo Please run setup.bat to install Python.
    echo.
    pause
    exit /b 1
)

echo Starting MTEL Telemetry Agent...
echo Using Python: %PYTHON%
echo.

"%PYTHON%" agent.py
pause
