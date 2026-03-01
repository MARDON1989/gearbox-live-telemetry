@echo off
title Kill MTEL Processes

echo Stopping MTEL processes...

taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM electron.exe /T 2>nul

echo Freeing port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)

echo Done.
timeout /t 1 >nul
exit /b 0
