@echo off
title MTEL Python Diagnostic

echo ========================================
echo MTEL Python Diagnostic
echo ========================================
echo.

set "PYTHON=%~dp0python\python.exe"
set "PIP=%~dp0python\Scripts\pip.exe"

echo Checking bundled Python...
if exist "%PYTHON%" (
    echo [OK] Python found at: %PYTHON%
    "%PYTHON%" --version
) else (
    echo [ERROR] Python NOT found at: %PYTHON%
    echo Please run setup.bat first.
    goto :end
)

echo.
echo Checking pip...
if exist "%PIP%" (
    echo [OK] pip found at: %PIP%
) else (
    echo [ERROR] pip NOT found at: %PIP%
    goto :end
)

echo.
echo Checking installed packages...
"%PIP%" list

echo.
echo Checking agent dependencies...
cd agent
"%PIP%" show pyirsdk
"%PIP%" show python-socketio
"%PIP%" show pyautogui
cd ..

echo.
echo Testing Python import...
"%PYTHON%" -c "import irsdk; print('irsdk: OK')"
"%PYTHON%" -c "import socketio; print('socketio: OK')"
"%PYTHON%" -c "import pyautogui; print('pyautogui: OK')"

echo.
echo ========================================
echo Diagnostic Complete
echo ========================================

:end
pause
