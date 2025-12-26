# MTEL Automated Installer for Windows
# This script automatically installs all dependencies and sets up MTEL

param(
    [string]$InstallPath = "$env:USERPROFILE\MTEL"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MTEL - MARDON Enhanced Telemetry" -ForegroundColor Cyan
Write-Host "  Automated Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) { return $true }
    } catch {
        return $false
    }
}

# Function to download and install a file
function Install-FromUrl {
    param(
        [string]$Url,
        [string]$OutputPath,
        [string]$Name
    )
    
    Write-Host "Downloading $Name..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing
        Write-Host "✓ Downloaded $Name" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ Failed to download $Name" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

# Step 1: Install Chocolatey (Package Manager)
Write-Host "[1/6] Checking Chocolatey..." -ForegroundColor Cyan
if (-not (Test-Command choco)) {
    Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    if (Test-Command choco) {
        Write-Host "✓ Chocolatey installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Chocolatey installation failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Chocolatey already installed" -ForegroundColor Green
}
Write-Host ""

# Step 2: Install Node.js
Write-Host "[2/6] Checking Node.js..." -ForegroundColor Cyan
if (-not (Test-Command node)) {
    Write-Host "Installing Node.js LTS..." -ForegroundColor Yellow
    choco install nodejs-lts -y
    refreshenv
    
    if (Test-Command node) {
        $nodeVersion = node --version
        Write-Host "✓ Node.js $nodeVersion installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Node.js installation failed" -ForegroundColor Red
        exit 1
    }
} else {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion already installed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Install Python
Write-Host "[3/6] Checking Python..." -ForegroundColor Cyan
if (-not (Test-Command python)) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host "  Python 3.11 is required but not found" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Python is required to run the MTEL telemetry agent." -ForegroundColor White
    Write-Host "We will now download and launch the Python installer." -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT: When the installer opens:" -ForegroundColor Cyan
    Write-Host "  1. CHECK 'Add Python to PATH' (very important!)" -ForegroundColor White
    Write-Host "  2. Click 'Install Now'" -ForegroundColor White
    Write-Host "  3. Wait for installation to complete" -ForegroundColor White
    Write-Host "  4. Close the installer when done" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to download and launch the installer"
    
    Write-Host "Downloading Python 3.11.7 installer..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe' -OutFile 'python_installer.exe' -UseBasicParsing
        Write-Host "✓ Downloaded Python installer" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to download Python installer" -ForegroundColor Red
        Write-Host "Please download and install Python manually from:" -ForegroundColor Yellow
        Write-Host "https://www.python.org/downloads/" -ForegroundColor White
        Write-Host ""
        Write-Host "Make sure to check 'Add Python to PATH' during installation!" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host ""
    Write-Host "Launching Python installer..." -ForegroundColor Yellow
    Write-Host "Please complete the installation and then return here." -ForegroundColor Cyan
    Write-Host ""
    
    # Launch installer with GUI (not silent)
    Start-Process -FilePath "python_installer.exe" -ArgumentList "InstallAllUsers=1","PrependPath=1","Include_test=0" -Wait
    Remove-Item "python_installer.exe" -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "Python installer has closed." -ForegroundColor Green
    Write-Host "Refreshing environment variables..." -ForegroundColor Yellow
    
    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Wait for PATH to update
    Start-Sleep -Seconds 3
    
    Write-Host "Verifying Python installation..." -ForegroundColor Yellow
    if (Test-Command python) {
        $pythonVersion = python --version
        Write-Host "✓ Python $pythonVersion installed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Red
        Write-Host "  Python installation verification failed" -ForegroundColor Red
        Write-Host "============================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Python was not found in PATH after installation." -ForegroundColor Yellow
        Write-Host "This usually means one of the following:" -ForegroundColor White
        Write-Host "  1. You didn't check 'Add Python to PATH' during install" -ForegroundColor White
        Write-Host "  2. You need to restart your computer" -ForegroundColor White
        Write-Host ""
        Write-Host "Please do ONE of the following:" -ForegroundColor Cyan
        Write-Host "  A. Restart your computer and run this script again" -ForegroundColor White
        Write-Host "  B. Reinstall Python and check 'Add Python to PATH'" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    $pythonVersion = python --version
    Write-Host "✓ Python $pythonVersion already installed" -ForegroundColor Green
}
Write-Host ""

# Step 4: Install Visual Studio Build Tools
Write-Host "[4/6] Checking Visual Studio Build Tools..." -ForegroundColor Cyan
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"

if (-not (Test-Path $vsWhere)) {
    Write-Host "Installing Visual Studio Build Tools 2022..." -ForegroundColor Yellow
    Write-Host "This may take 10-15 minutes. Please be patient..." -ForegroundColor Yellow
    
    choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.Windows11SDK.22621 --includeRecommended --passive" -y
    
    Write-Host "✓ Visual Studio Build Tools installed" -ForegroundColor Green
    Write-Host "NOTE: A system restart may be required" -ForegroundColor Yellow
} else {
    Write-Host "✓ Visual Studio Build Tools already installed" -ForegroundColor Green
}
Write-Host ""

# Step 5: Create installation directory and copy files
Write-Host "[5/6] Setting up MTEL..." -ForegroundColor Cyan

if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "✓ Created installation directory: $InstallPath" -ForegroundColor Green
}

# Assuming the script is run from the MTEL directory
$SourcePath = $PSScriptRoot
if (Test-Path "$SourcePath\backend") {
    Write-Host "Copying MTEL files..." -ForegroundColor Yellow
    Copy-Item -Path "$SourcePath\*" -Destination $InstallPath -Recurse -Force -Exclude @('node_modules', '__pycache__', '*.db', '.git')
    Write-Host "✓ Files copied to $InstallPath" -ForegroundColor Green
} else {
    Write-Host "✗ MTEL source files not found. Please run this script from the MTEL directory." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Setup Bundled Python
Write-Host "[6/6] Setting up Python..." -ForegroundColor Cyan

if (-not (Test-Path "$InstallPath\python\python.exe")) {
    Write-Host "Downloading portable Python..." -ForegroundColor Yellow
    Write-Host "This is a one-time setup and will take a few minutes." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # Download Python embeddable package
        Write-Host "[1/4] Downloading Python 3.11.7 embeddable package..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip' -OutFile "$InstallPath\python.zip" -UseBasicParsing
        Write-Host "✓ Downloaded Python" -ForegroundColor Green
        
        # Extract Python
        Write-Host "[2/4] Extracting Python..." -ForegroundColor Yellow
        Expand-Archive -Path "$InstallPath\python.zip" -DestinationPath "$InstallPath\python" -Force
        Remove-Item "$InstallPath\python.zip"
        Write-Host "✓ Extracted Python" -ForegroundColor Green
        
        # Configure Python to use site-packages
        Write-Host "[3/4] Configuring Python..." -ForegroundColor Yellow
        $pthFile = "$InstallPath\python\python311._pth"
        if (Test-Path $pthFile) {
            Add-Content -Path $pthFile -Value "import site"
        }
        Write-Host "✓ Configured Python" -ForegroundColor Green
        
        # Install pip
        Write-Host "[4/4] Installing pip..." -ForegroundColor Yellow
        Set-Location "$InstallPath\python"
        Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile 'get-pip.py' -UseBasicParsing
        & ".\python.exe" get-pip.py --no-warn-script-location
        Remove-Item 'get-pip.py'
        Write-Host "✓ Installed pip" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "✓ Python setup complete!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to setup Python" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✓ Bundled Python already installed" -ForegroundColor Green
}

# Verify Python
$pythonExe = "$InstallPath\python\python.exe"
if (Test-Path $pythonExe) {
    $pythonVersion = & $pythonExe --version
    Write-Host "✓ Python $pythonVersion ready" -ForegroundColor Green
} else {
    Write-Host "✗ Python verification failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Install Python agent dependencies
Write-Host "Installing Python agent dependencies..." -ForegroundColor Yellow
Set-Location "$InstallPath\agent"
$pipExe = "$InstallPath\python\Scripts\pip.exe"
& $pipExe install -r requirements.txt --no-warn-script-location
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Agent dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Agent installation failed" -ForegroundColor Red
}

Write-Host ""

# Create .env file
Write-Host "Creating configuration file..." -ForegroundColor Yellow
$envContent = @"
PORT=3000
DATABASE_PATH=./telemetry.db
NODE_ENV=production
"@
Set-Content -Path "$InstallPath\backend\.env" -Value $envContent
Write-Host "✓ Configuration file created" -ForegroundColor Green
Write-Host ""

# Create start scripts
Write-Host "Creating start scripts..." -ForegroundColor Yellow

# Start Server script
$startServerContent = @"
@echo off
title MTEL Server
cd /d "%~dp0backend"
echo Starting MTEL Server...
echo Server will be available at http://localhost:3000
echo.
node server.js
pause
"@
Set-Content -Path "$InstallPath\Start-Server.bat" -Value $startServerContent

# Start Agent script
$startAgentContent = @"
@echo off
title MTEL Agent
cd /d "%~dp0agent"
echo Starting MTEL Telemetry Agent...
echo Make sure the server is running first!
echo.
python agent.py
pause
"@
Set-Content -Path "$InstallPath\Start-Agent.bat" -Value $startAgentContent

# Start Desktop script
$startDesktopContent = @"
@echo off
title MTEL Desktop
cd /d "%~dp0desktop"
echo Starting MTEL Desktop Application...
echo.
npm start
pause
"@
Set-Content -Path "$InstallPath\Start-Desktop.bat" -Value $startDesktopContent

Write-Host "✓ Start scripts created" -ForegroundColor Green
Write-Host ""

# Create desktop shortcuts
Write-Host "Creating desktop shortcuts..." -ForegroundColor Yellow
$WshShell = New-Object -ComObject WScript.Shell

# Server shortcut
$ServerShortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\MTEL Server.lnk")
$ServerShortcut.TargetPath = "$InstallPath\Start-Server.bat"
$ServerShortcut.WorkingDirectory = $InstallPath
$ServerShortcut.Description = "Start MTEL Server"
$ServerShortcut.Save()

# Agent shortcut
$AgentShortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\MTEL Agent.lnk")
$AgentShortcut.TargetPath = "$InstallPath\Start-Agent.bat"
$AgentShortcut.WorkingDirectory = $InstallPath
$AgentShortcut.Description = "Start MTEL Telemetry Agent"
$AgentShortcut.Save()

Write-Host "✓ Desktop shortcuts created" -ForegroundColor Green
Write-Host ""

# Installation complete
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "MTEL has been installed to: $InstallPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Desktop shortcuts created:" -ForegroundColor Cyan
Write-Host "  - MTEL Server (start this first)" -ForegroundColor White
Write-Host "  - MTEL Agent (start after server)" -ForegroundColor White
Write-Host ""
Write-Host "To start using MTEL:" -ForegroundColor Yellow
Write-Host "  1. Double-click 'MTEL Server' on your desktop" -ForegroundColor White
Write-Host "  2. Open browser to http://localhost:3000" -ForegroundColor White
Write-Host "  3. Double-click 'MTEL Agent' on your desktop" -ForegroundColor White
Write-Host "  4. Start iRacing and begin driving!" -ForegroundColor White
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  - Edit $InstallPath\agent\start_agent.bat to set your driver name" -ForegroundColor White
Write-Host "  - Edit $InstallPath\backend\.env for server settings" -ForegroundColor White
Write-Host ""

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Some components may require a system restart" -ForegroundColor Yellow
    $restart = Read-Host "Would you like to restart now? (y/n)"
    if ($restart -eq 'y') {
        Restart-Computer
    }
}

Read-Host "Press Enter to exit"
