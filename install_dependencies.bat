@echo off
title MTEL - Install Python Dependencies

echo ========================================
echo MTEL - Installing Python Dependencies
echo ========================================
echo.

cd /d "%~dp0"

set "PYTHON=%~dp0python\python.exe"
set "PIP=%~dp0python\Scripts\pip.exe"

if not exist "%PYTHON%" (
    echo [ERROR] Bundled Python not found!
    echo Please run setup.bat first to download Python.
    pause
    exit /b 1
)

if not exist "%PIP%" (
    echo [ERROR] pip not found!
    echo Python may not be configured correctly.
    echo Please delete the python folder and run setup.bat again.
    pause
    exit /b 1
)

echo Installing agent dependencies...
echo.

cd agent
"%PIP%" install -r requirements.txt --no-warn-script-location

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Dependencies installed successfully!
    echo ========================================
    echo.
    echo You can now run the agent with start_agent.bat
) else (
    echo.
    echo ========================================
    echo Installation failed!
    echo ========================================
    echo.
    echo Please check your internet connection and try again.
)

cd ..
pause
