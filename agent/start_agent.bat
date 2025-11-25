@echo off
REM iRacing Telemetry Agent Launcher
REM This script starts the telemetry agent on Windows

echo Starting iRacing Telemetry Agent...
echo.

REM Set your driver name here
set DRIVER_NAME=YourName

REM Start the agent
python agent.py

pause
