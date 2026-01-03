; MTEL Inno Setup Installer Script
; Creates a professional Windows installer for MTEL

#define MyAppName "MTEL"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "MARDON"
#define MyAppURL "https://github.com/yourusername/MTEL"
#define MyAppExeName "Start-Server.bat"

[Setup]
AppId={{MTEL-MARDON-TELEMETRY}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE
OutputDir=installer
OutputBaseFilename=MTEL-Setup-{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
SetupIconFile=desktop\icon.ico
UninstallDisplayIcon={app}\desktop\icon.ico

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "frontend\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "agent\*"; DestDir: "{app}\agent"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "desktop\*"; DestDir: "{app}\desktop"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "API.md"; DestDir: "{app}"; Flags: ignoreversion
Source: ".env.example"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "Start-App.bat"; DestDir: "{app}"; Flags: ignoreversion
; NOTE: node_modules are included in backend/desktop directories above
; NOTE: Python packages are included in agent/lib directory above

[Dirs]
Name: "{app}\backend\data"; Permissions: users-modify

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\Start-App.bat"; WorkingDir: "{app}"; IconFilename: "{app}\desktop\icon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\Start-App.bat"; WorkingDir: "{app}"; Tasks: desktopicon; IconFilename: "{app}\desktop\icon.ico"

[Run]
; Create .env file with correct port
Filename: "powershell.exe"; Parameters: "-Command ""Set-Content -Path '{app}\backend\.env' -Value 'PORT=3000', 'NODE_ENV=production'"""; Flags: runhidden

; Launch Application
Filename: "{app}\Start-App.bat"; Description: "Launch MTEL"; Flags: postinstall nowait skipifsilent

[Code]
var
  NodeJsDownloadPage: TDownloadWizardPage;
  PythonDownloadPage: TDownloadWizardPage;

function NodeJsInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c node --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function PythonInstalled: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('cmd.exe', '/c python --version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

procedure InitializeWizard;
begin
  // Create download pages for Node.js and Python if needed
  if not NodeJsInstalled or not PythonInstalled then
  begin
    NodeJsDownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), 'Downloading Node.js...', nil);
    PythonDownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), 'Downloading Python...', nil);
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  ResultCode: Integer;
  NodeJsInstaller: String;
  PythonInstaller: String;
begin
  Result := True;
  
  if CurPageID = wpReady then
  begin
    // Download Node.js if not installed
    if not NodeJsInstalled then
    begin
      NodeJsDownloadPage.Clear;
      NodeJsDownloadPage.Add('https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi', 'node-installer.msi', '');
      NodeJsDownloadPage.Show;
      try
        NodeJsDownloadPage.Download;
        Result := True;
      except
        MsgBox('Failed to download Node.js installer. Please check your internet connection.', mbError, MB_OK);
        Result := False;
        Exit;
      finally
        NodeJsDownloadPage.Hide;
      end;
      
      // Install Node.js
      NodeJsInstaller := ExpandConstant('{tmp}\node-installer.msi');
      if FileExists(NodeJsInstaller) then
      begin
        MsgBox('Node.js will now be installed. This may take a few minutes.', mbInformation, MB_OK);
        if not Exec('msiexec.exe', '/i "' + NodeJsInstaller + '" /qb ADDLOCAL=ALL', '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
        begin
          MsgBox('Failed to install Node.js. Please install manually from https://nodejs.org', mbError, MB_OK);
          Result := False;
          Exit;
        end;
        
        // Refresh environment
        Sleep(2000);
      end;
    end;
    
    // Download Python if not installed
    if not PythonInstalled then
    begin
      PythonDownloadPage.Clear;
      PythonDownloadPage.Add('https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe', 'python-installer.exe', '');
      PythonDownloadPage.Show;
      try
        PythonDownloadPage.Download;
        Result := True;
      except
        MsgBox('Failed to download Python installer. Please check your internet connection.', mbError, MB_OK);
        Result := False;
        Exit;
      finally
        PythonDownloadPage.Hide;
      end;
      
      // Install Python
      PythonInstaller := ExpandConstant('{tmp}\python-installer.exe');
      if FileExists(PythonInstaller) then
      begin
        MsgBox('Python will now be installed. This may take a few minutes.' + #13#10 + #13#10 + 'IMPORTANT: Make sure "Add Python to PATH" is checked!', mbInformation, MB_OK);
        if not Exec(PythonInstaller, '/passive InstallAllUsers=1 PrependPath=1 Include_test=0', '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
        begin
          MsgBox('Failed to install Python. Please install manually from https://python.org', mbError, MB_OK);
          Result := False;
          Exit;
        end;
        
        // Refresh environment
        Sleep(2000);
        
        // Install Python packages
        Exec('cmd.exe', '/c python -m pip install --upgrade pip', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
        Exec('cmd.exe', '/c cd /d "' + ExpandConstant('{app}\agent') + '" && python -m pip install -r requirements.txt', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      end;
    end;
  end;
  
  // Install backend dependencies
  if CurPageID = wpInstalling then
  begin
    Exec('cmd.exe', '/c cd /d "' + ExpandConstant('{app}\backend') + '" && npm install --production', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('cmd.exe', '/c cd /d "' + ExpandConstant('{app}\desktop') + '" && npm install --production', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
  
  // Create .env file with port configuration
  if CurPageID = wpInstalling then
  begin
    SaveStringToFile(ExpandConstant('{app}\backend\.env'), 'PORT=3000' + #13#10, False);
  end;
end;

[UninstallDelete]
Type: filesandordirs; Name: "{app}\backend\node_modules"
Type: filesandordirs; Name: "{app}\desktop\node_modules"
Type: filesandordirs; Name: "{app}\agent\lib"
Type: filesandordirs; Name: "{app}\backend\telemetry.db"
Type: files; Name: "{app}\backend\.env"

[Messages]
WelcomeLabel2=This will install [name/ver] on your computer.%n%nMTEL is an advanced iRacing telemetry system.%n%nThe installer will automatically download and install:%n- Node.js (if not already installed)%n- Python 3.11 (if not already installed)%n%nThis may take 5-10 minutes depending on what needs to be installed.
FinishedLabel=MTEL has been installed successfully!%n%nTo start using MTEL:%n1. Launch "MTEL" from the Start Menu or Desktop%n2. The server will start automatically%n3. Open your browser to http://localhost:3000%n4. Start iRacing and begin driving!
