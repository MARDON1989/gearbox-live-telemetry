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

:: Note: Python packages are bundled in agent/lib.
:: Note: Node.js packages are bundled in node_modules.

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
