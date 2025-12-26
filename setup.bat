@echo off
echo ==========================================
echo      MTEL - First Time Setup
echo ==========================================
echo.

:: 1. Add common Node.js and Python paths to the current session environment
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs"
set "PATH=%PATH%;C:\Python311;C:\Python311\Scripts;C:\Program Files\Python311;C:\Program Files\Python311\Scripts;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python311\Scripts"

:: 2. Setup Node.js (Bundled Portable Node.js)
echo ------------------------------------------
echo Setting up Node.js...
echo ------------------------------------------

:: Check if bundled Node.js exists
if not exist "%~dp0nodejs\node.exe" (
    echo Bundled Node.js not found. Downloading portable Node.js...
    echo This is a one-time setup and will take a few minutes.
    echo.
    
    :: Download Node.js portable
    echo [1/2] Downloading Node.js 20.11.0 portable...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip' -OutFile 'nodejs.zip'"
    
    if not exist nodejs.zip (
        echo [ERROR] Failed to download Node.js
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
    
    :: Extract Node.js
    echo [2/2] Extracting Node.js...
    powershell -Command "Expand-Archive -Path 'nodejs.zip' -DestinationPath '.' -Force"
    
    :: Rename extracted folder to nodejs
    if exist node-v20.11.0-win-x64 (
        move node-v20.11.0-win-x64 nodejs
    )
    
    del nodejs.zip
    
    echo.
    echo Node.js setup complete!
    echo.
) else (
    echo Bundled Node.js found.
)

:: Set Node.js paths
set "NODE=%~dp0nodejs\node.exe"
set "NPM=%~dp0nodejs\npm.cmd"

:: Verify Node.js works
echo Verifying Node.js installation...
cd /d "%~dp0nodejs"
node.exe --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js verification failed
    echo Please delete the 'nodejs' folder and run setup.bat again.
    pause
    exit /b 1
)
cd /d "%~dp0"

echo.

:: Add nodejs to PATH for this session
set "PATH=%~dp0nodejs;%PATH%"

:: 3. Install Backend Dependencies
echo ------------------------------------------
echo Installing Backend Dependencies...
echo ------------------------------------------
cd backend
if not exist package.json (
    echo [ERROR] backend/package.json not found!
    pause
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed.
echo.

:: 4. Install Desktop Dependencies
echo ------------------------------------------
echo Installing Desktop Dependencies...
echo ------------------------------------------
cd desktop
if not exist package.json (
    echo [ERROR] desktop/package.json not found!
    pause
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install desktop dependencies.
    pause
    exit /b 1
)
cd ..
echo Desktop dependencies installed.
echo.

:: 5. Setup Python (Bundled Portable Python)
echo ------------------------------------------
echo Setting up Python...
echo ------------------------------------------

:: Check if bundled Python exists
if not exist "%~dp0python\python.exe" (
    echo Bundled Python not found. Downloading portable Python...
    echo This is a one-time setup and will take a few minutes.
    echo.
    
    :: Download Python embeddable package
    echo [1/4] Downloading Python 3.11.7 embeddable package...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip' -OutFile 'python.zip'"
    
    if not exist python.zip (
        echo [ERROR] Failed to download Python
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
    
    :: Extract Python
    echo [2/4] Extracting Python...
    powershell -Command "Expand-Archive -Path 'python.zip' -DestinationPath 'python' -Force"
    del python.zip
    
    :: Configure Python to use site-packages
    echo [3/4] Configuring Python...
    cd python
    if exist python311._pth (
        echo import site >> python311._pth
    )
    
    :: Install pip
    echo [4/4] Installing pip...
    powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile 'get-pip.py'"
    python.exe get-pip.py --no-warn-script-location
    del get-pip.py
    cd ..
    
    echo.
    echo Python setup complete!
    echo.
) else (
    echo Bundled Python found.
)

:: Set Python paths
set "PYTHON=%~dp0python\python.exe"
set "PIP=%~dp0python\Scripts\pip.exe"

:: Verify Python works
echo Verifying Python installation...
cd /d "%~dp0python"
python.exe --version
if %errorlevel% neq 0 (
    echo [ERROR] Python verification failed
    echo Please delete the 'python' folder and run setup.bat again.
    pause
    exit /b 1
)
cd /d "%~dp0"

echo.

:: Add Python to PATH for this session
set "PATH=%~dp0python;%~dp0python\Scripts;%PATH%"

:: 6. Install Agent Dependencies
echo ------------------------------------------
echo Installing Agent Dependencies...
echo ------------------------------------------
cd agent
if not exist requirements.txt (
    echo [ERROR] agent/requirements.txt not found!
    pause
    exit /b 1
)
pip install -r requirements.txt --no-warn-script-location
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install agent dependencies.
    echo.
    echo Please try running manually:
    echo   cd agent
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)
cd ..
echo Agent dependencies installed.
echo.

echo ==========================================
echo      Setup Complete!
echo ==========================================
echo.
echo MTEL is now ready to use!
echo Python is bundled - no system installation needed.
echo.
timeout /t 3
