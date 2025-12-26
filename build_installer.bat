@echo off
REM MTEL Installer Build Script
REM This script prepares dependencies and builds the installer

echo ==========================================
echo   MTEL Installer Build Script
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/6] Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js found.

echo [2/6] Checking for Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    echo Please install Python from https://python.org
    pause
    exit /b 1
)
echo Python found.

echo [3/6] Installing backend dependencies...
cd backend
if not exist package.json (
    echo ERROR: backend/package.json not found!
    pause
    exit /b 1
)
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed.

echo [4/6] Installing desktop dependencies...
cd desktop
if not exist package.json (
    echo ERROR: desktop/package.json not found!
    pause
    exit /b 1
)
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install desktop dependencies
    pause
    exit /b 1
)
cd ..
echo Desktop dependencies installed.

echo [5/6] Installing agent Python packages...
cd agent
if not exist requirements.txt (
    echo ERROR: agent/requirements.txt not found!
    pause
    exit /b 1
)
if not exist lib mkdir lib
pip install -r requirements.txt --target lib --upgrade
if %errorlevel% neq 0 (
    echo ERROR: Failed to install agent dependencies
    pause
    exit /b 1
)
cd ..
echo Agent dependencies installed.

echo [6/6] Building installer with Inno Setup...
if not exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    echo ERROR: Inno Setup not found!
    echo Please install Inno Setup from https://jrsoftware.org/isdl.php
    pause
    exit /b 1
)

"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
if %errorlevel% neq 0 (
    echo ERROR: Failed to build installer
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Build Complete!
echo ==========================================
echo.
echo Installer created: installer\MTEL-Setup-2.0.0.exe
echo.
echo IMPORTANT: The installer includes:
echo - backend\node_modules\
echo - desktop\node_modules\
echo - agent\lib\
echo.
echo Total size: ~60MB
echo.
pause
