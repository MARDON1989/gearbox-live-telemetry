@echo off
echo Checking MTEL Build Requirements...
echo.

:: Check Node.js
echo [1/3] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [MISSING] Node.js is not installed
    echo Download from: https://nodejs.org/
    echo Required: Node.js 20.x LTS
    set MISSING=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js %NODE_VERSION% installed
)
echo.

:: Check Python
echo [2/3] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [MISSING] Python is not installed
    echo Download from: https://python.org/
    echo Required: Python 3.11+
    set MISSING=1
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo [OK] %PYTHON_VERSION% installed
)
echo.

:: Check Inno Setup
echo [3/3] Checking Inno Setup Compiler...
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    echo [OK] Inno Setup 6 installed
) else (
    echo [MISSING] Inno Setup is not installed
    echo Download from: https://jrsoftware.org/isdl.php
    echo Required: Inno Setup 6
    set MISSING=1
)
echo.

if defined MISSING (
    echo ============================================================
    echo BUILD REQUIREMENTS NOT MET
    echo ============================================================
    echo Please install the missing components and try again.
    echo.
    pause
    exit /b 1
) else (
    echo ============================================================
    echo ALL BUILD REQUIREMENTS MET
    echo ============================================================
    echo You can now run build_installer.bat
    echo.
    pause
)
