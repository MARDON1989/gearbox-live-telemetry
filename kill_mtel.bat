@echo off
title Kill MTEL Processes

echo ==========================================
echo   Stopping all MTEL processes...
echo ==========================================
echo.

echo [1/4] Killing Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo   Node.js processes stopped.
) else (
    echo   No Node.js processes found.
)

echo [2/4] Killing Python processes...
taskkill /F /IM python.exe 2>nul
if %errorlevel% equ 0 (
    echo   Python processes stopped.
) else (
    echo   No Python processes found.
)

echo [3/4] Killing Electron processes...
taskkill /F /IM electron.exe 2>nul
if %errorlevel% equ 0 (
    echo   Electron processes stopped.
) else (
    echo   No Electron processes found.
)

echo [4/4] Freeing port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)
echo   Port 3000 freed.

echo.
echo ==========================================
echo   All MTEL processes stopped!
echo ==========================================
echo.
echo You can now run Start-App.bat again.
echo.
pause
