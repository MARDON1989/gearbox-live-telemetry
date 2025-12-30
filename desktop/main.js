/**
 * MTEL Desktop - Electron Main Process
 * Windows desktop application for Mardon Telemetry
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let buttonBoxWindow;
let tray;
let backendProcess = null;
let agentProcess = null;

// Determine paths based on environment
const isDev = process.env.NODE_ENV === 'development';
const rootDir = path.resolve(__dirname, '..');
const backendScript = path.join(rootDir, 'backend', 'server.js');
const agentScript = path.join(rootDir, 'agent', 'agent.py');

function startBackend() {
    console.log('Starting Backend Server...');
    backendProcess = spawn('node', [backendScript], {
        cwd: path.join(rootDir, 'backend'),
        stdio: 'pipe' // Capture output if needed
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

function startAgent() {
    console.log('Starting Telemetry Agent...');
    // Try 'python' first, then 'python3' if needed (mostly for Linux/Mac, Windows usually 'python')
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    agentProcess = spawn(pythonCmd, [agentScript], {
        cwd: path.join(rootDir, 'agent'),
        stdio: 'pipe'
    });

    agentProcess.stdout.on('data', (data) => {
        console.log(`Agent: ${data}`);
    });

    agentProcess.stderr.on('data', (data) => {
        console.error(`Agent Error: ${data}`);
    });

    agentProcess.on('close', (code) => {
        console.log(`Agent process exited with code ${code}`);
    });
}

function killProcesses() {
    if (backendProcess) {
        console.log('Stopping Backend...');
        backendProcess.kill();
        backendProcess = null;
    }
    if (agentProcess) {
        console.log('Stopping Agent...');
        agentProcess.kill();
        agentProcess = null;
    }
}

function createWindow() {
    // Load saved window bounds or use defaults
    const Store = require('electron-store');
    const store = new Store();

    // Get saved values separately
    const savedWidth = store.get('windowWidth', 1200);
    const savedHeight = store.get('windowHeight', 800);
    const savedX = store.get('windowX');
    const savedY = store.get('windowY');

    console.log('Loading window bounds:', { width: savedWidth, height: savedHeight, x: savedX, y: savedY });

    mainWindow = new BrowserWindow({
        width: savedWidth,
        height: savedHeight,
        x: savedX,
        y: savedY,
        frame: false, // Frameless for custom title bar
        transparent: true, // Transparent for overlay mode
        backgroundColor: '#00000000', // Start fully transparent
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false
        },
        icon: path.join(__dirname, 'icon.ico')
    });

    // Force bounds after creation to support multi-monitor widths
    // Electron may clamp width during creation, so we set it again
    if (savedWidth && savedHeight) {
        setTimeout(() => {
            mainWindow.setBounds({
                x: savedX || 0,
                y: savedY || 0,
                width: savedWidth,
                height: savedHeight
            });
            console.log('Forced window bounds to:', { width: savedWidth, height: savedHeight, x: savedX, y: savedY });
        }, 100);
    }

    // Save window bounds function
    const saveBounds = () => {
        if (!mainWindow.isMaximized() && !mainWindow.isMinimized() && !mainWindow.isDestroyed()) {
            const bounds = mainWindow.getBounds();
            // Save each value separately
            store.set('windowWidth', bounds.width);
            store.set('windowHeight', bounds.height);
            store.set('windowX', bounds.x);
            store.set('windowY', bounds.y);
            console.log('Saved window bounds:', bounds);
        }
    };

    mainWindow.on('resize', saveBounds);
    mainWindow.on('move', saveBounds);

    // Also save on blur (when window loses focus)
    mainWindow.on('blur', saveBounds);

    // IPC Handlers for Window Management
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.on('window-close', () => mainWindow.hide()); // Minimize to tray instead of closing

    ipcMain.on('set-fullscreen', (event, flag) => {
        mainWindow.setFullScreen(flag);
    });

    ipcMain.on('toggle-overlay', (event, isOverlay) => {
        mainWindow.setAlwaysOnTop(isOverlay, 'screen-saver');
    });

    // Click-Through / Lock Overlay Logic
    let isClickThrough = false;

    function toggleClickThrough(state) {
        isClickThrough = state !== undefined ? state : !isClickThrough;
        mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });
        mainWindow.webContents.send('click-through-toggled', isClickThrough);
        // If locked, ensure it stays on top
        if (isClickThrough) {
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
        }
    }

    ipcMain.on('toggle-click-through', (event, state) => {
        toggleClickThrough(state);
    });

    // Register Global Shortcut for Lock/Unlock (Ctrl+L)
    const { globalShortcut } = require('electron');
    globalShortcut.register('CommandOrControl+L', () => {
        toggleClickThrough();
    });

    // Load the frontend from the backend server
    // Wait a bit for server to start
    setTimeout(() => {
        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        mainWindow.loadURL(serverUrl).catch(err => {
            console.log('Server not ready yet, retrying...', err);
            setTimeout(() => mainWindow.loadURL(serverUrl), 2000);
        });
        mainWindow.show();
    }, 2000); // Give backend 2 seconds to start

    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // Handle window close
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            // Save bounds before hiding
            if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
                const bounds = mainWindow.getBounds();
                store.set('windowWidth', bounds.width);
                store.set('windowHeight', bounds.height);
                store.set('windowX', bounds.x);
                store.set('windowY', bounds.y);
                console.log('Saving on close:', bounds);
            }
            mainWindow.hide();
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle F11 for fullscreen toggle
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11' && input.type === 'keyDown') {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
    });
}

// Create Button Box Window
function createButtonBoxWindow() {
    // Don't create if already exists
    if (buttonBoxWindow && !buttonBoxWindow.isDestroyed()) {
        buttonBoxWindow.focus();
        return;
    }

    const Store = require('electron-store');
    const store = new Store();

    // Load saved bounds or use defaults
    const savedBounds = store.get('buttonbox-bounds', {
        width: 850,
        height: 600,
        x: undefined,
        y: undefined
    });

    buttonBoxWindow = new BrowserWindow({
        width: savedBounds.width,
        height: savedBounds.height,
        x: savedBounds.x,
        y: savedBounds.y,
        minWidth: 600,
        minHeight: 400,
        frame: true,
        backgroundColor: '#0a0a0f',
        title: 'MTEL - Button Box',
        icon: path.join(__dirname, '../frontend/mardon-logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Save bounds on resize/move
    const saveBounds = () => {
        if (!buttonBoxWindow.isDestroyed()) {
            const bounds = buttonBoxWindow.getBounds();
            store.set('buttonbox-bounds', bounds);
        }
    };

    buttonBoxWindow.on('resize', saveBounds);
    buttonBoxWindow.on('move', saveBounds);

    // Load button box page
    setTimeout(() => {
        const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
        buttonBoxWindow.loadURL(`${serverUrl}/buttonbox.html`).catch(err => {
            console.log('Failed to load button box:', err);
        });
    }, 500);

    // Handle close
    buttonBoxWindow.on('close', () => {
        saveBounds();
    });

    buttonBoxWindow.on('closed', () => {
        buttonBoxWindow = null;
    });
}

function createTray() {
    // Create tray icon
    const iconPath = path.join(__dirname, 'icon.ico'); // Updated to use .ico
    const trayIcon = nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show MTEL',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Hide MTEL',
            click: () => {
                mainWindow.hide();
            }
        },
        {
            label: 'Toggle Fullscreen (F11)',
            click: () => {
                mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
        },
        {
            label: 'Open Button Box',
            click: () => {
                createButtonBoxWindow();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('MTEL - Mardon Telemetry');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

// IPC Handlers
ipcMain.on('open-history', () => {
    const { shell } = require('electron');
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    shell.openExternal(`${serverUrl}/history.html`);
});

ipcMain.on('open-buttonbox', () => {
    createButtonBoxWindow();
});

app.whenReady().then(() => {
    startBackend();
    startAgent();
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
    killProcesses();
});
