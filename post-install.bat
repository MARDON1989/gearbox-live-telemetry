@echo off
title MTEL Post-Installation Setup
color 0A

echo ============================================================
echo MTEL Post-Installation Setup
echo ============================================================
echo.
echo This will install all required dependencies for MTEL.
echo This may take 5-10 minutes depending on your internet speed.
echo.
echo Please wait...
echo.

:: Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH
    echo Please restart your computer and try again.
    echo.
    pause
    exit /b 1
)

:: Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH
    echo Please restart your computer and try again.
    echo.
    pause
    exit /b 1
)

echo [1/4] Upgrading pip...
python -m pip install --upgrade pip --quiet
if %errorlevel% neq 0 (
    echo [ERROR] Failed to upgrade pip
    pause
    exit /b 1
)
echo [OK] Pip upgraded successfully
echo.

echo [2/4] Installing Python packages (pyirsdk, python-socketio, pyautogui)...
cd /d "%~dp0agent"
python -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python packages
    echo.
    echo Please try manually:
    echo   cd "%~dp0agent"
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)
echo [OK] Python packages installed successfully
echo.

:: Note: Node.js packages (node_modules) are bundled with the installer.
:: No need to run npm install on the client machine.

:: Create .env file if it doesn't exist
cd /d "%~dp0backend"
if not exist ".env" (
    echo PORT=3000> .env
    echo NODE_ENV=production>> .env
    echo [OK] Created .env configuration file
)

echo.
echo ============================================================
echo Installation Complete!
echo ============================================================
echo.
echo All dependencies have been installed successfully.
echo You can now launch MTEL from the Start Menu or Desktop.
echo.
pause
