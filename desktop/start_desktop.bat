@echo off
title MTEL Desktop

cd /d "%~dp0"

echo Starting MTEL Desktop Application...

:: Check if node_modules exists
if not exist "node_modules" (
    echo ERROR: Dependencies not installed!
    echo Please run: npm install
    pause
    exit /b 1
)

:: Start Electron app
npm start
